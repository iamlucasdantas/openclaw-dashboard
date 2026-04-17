"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth-guards";
import { audit } from "@/lib/audit";

const budgetSchema = z.object({
  monthlyBudgetUsd: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(
      z
        .union([z.null(), z.number().min(0).max(1_000_000)])
        .transform((v) => (v === 0 ? null : v))
    ),
});

export type BudgetFormState = {
  error?: string | null;
  success?: string | null;
};

export async function setTenantBudget(
  tenantId: string,
  _prev: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  await requireAdmin();
  const parsed = budgetSchema.safeParse({
    monthlyBudgetUsd: formData.get("monthlyBudgetUsd"),
  });
  if (!parsed.success) return { error: "Valor inválido." };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { monthlyBudgetUsd: parsed.data.monthlyBudgetUsd },
  });
  await audit({
    action: "tenant.set_budget",
    entityType: "tenant",
    entityId: tenantId,
    meta: { monthlyBudgetUsd: parsed.data.monthlyBudgetUsd },
  });
  revalidatePath("/admin/tenants");
  revalidatePath("/admin/costs");
  return { success: "Limite mensal atualizado." };
}

export async function setAgentBudget(
  agentDbId: string,
  scope: "admin" | "client",
  _prev: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  const session = await requireSession();
  const agent = await prisma.agent.findUnique({ where: { id: agentDbId } });
  if (!agent) return { error: "Agente não encontrado." };
  if (
    !session.user.isAdmin &&
    !(session.user.tenantIds ?? []).includes(agent.tenantId)
  ) {
    return { error: "Acesso negado." };
  }

  const parsed = budgetSchema.safeParse({
    monthlyBudgetUsd: formData.get("monthlyBudgetUsd"),
  });
  if (!parsed.success) return { error: "Valor inválido." };

  await prisma.agent.update({
    where: { id: agentDbId },
    data: { monthlyBudgetUsd: parsed.data.monthlyBudgetUsd },
  });
  await audit({
    action: "agent.set_budget",
    entityType: "agent",
    entityId: agentDbId,
    meta: { scope, agentId: agent.agentId, monthlyBudgetUsd: parsed.data.monthlyBudgetUsd },
  });
  revalidatePath(`/admin/agents/${agent.agentId}`);
  revalidatePath(`/client/agents/${agent.agentId}`);
  revalidatePath("/admin/costs");
  return { success: "Limite mensal atualizado." };
}
