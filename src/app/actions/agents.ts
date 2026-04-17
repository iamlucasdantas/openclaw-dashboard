"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";

const agentIdRegex = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

const agentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  agentId: z
    .string()
    .trim()
    .toLowerCase()
    .regex(agentIdRegex, "agentId: 3-64 chars, apenas a-z, 0-9 e '-'"),
  tenantId: z.string().min(1, "Selecione um cliente"),
  persona: z.string().trim().max(500).optional().or(z.literal("")),
  model: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.enum(["online", "offline", "degraded"]).default("offline"),
});

export type AgentFormState = {
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

type Scope = "admin" | "client";

function parseForm(formData: FormData) {
  return agentSchema.safeParse({
    name: formData.get("name"),
    agentId: formData.get("agentId"),
    tenantId: formData.get("tenantId"),
    persona: formData.get("persona") ?? "",
    model: formData.get("model") ?? "",
    status: formData.get("status") ?? "offline",
  });
}

function parseScope(formData: FormData): Scope {
  return formData.get("scope") === "client" ? "client" : "admin";
}

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[issue.path.join(".")] = issue.message;
  return out;
}

function redirectAfter(scope: Scope, agentId: string): never {
  redirect(scope === "client" ? `/client/agents/${agentId}` : `/admin/agents/${agentId}`);
}

function canWriteTenant(
  session: { user: { isAdmin: boolean; tenantIds: string[] } },
  tenantId: string
) {
  if (session.user.isAdmin) return true;
  return (session.user.tenantIds ?? []).includes(tenantId);
}

export async function createAgent(
  _prev: AgentFormState,
  formData: FormData
): Promise<AgentFormState> {
  const session = await requireSession();
  const scope = parseScope(formData);
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  if (!canWriteTenant(session, parsed.data.tenantId)) {
    return { error: "Você não tem acesso a este cliente." };
  }

  try {
    await prisma.agent.create({
      data: {
        name: parsed.data.name,
        agentId: parsed.data.agentId,
        tenantId: parsed.data.tenantId,
        persona: parsed.data.persona || null,
        model: parsed.data.model || null,
        status: parsed.data.status,
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { fieldErrors: { agentId: "Já existe um agente com este agentId." } };
    }
    if (e?.code === "P2003") {
      return { fieldErrors: { tenantId: "Cliente inválido." } };
    }
    return { error: "Erro ao criar agente." };
  }

  revalidatePath("/admin/agents");
  revalidatePath("/client/agents");
  redirectAfter(scope, parsed.data.agentId);
}

export async function updateAgent(
  id: string,
  _prev: AgentFormState,
  formData: FormData
): Promise<AgentFormState> {
  const session = await requireSession();
  const scope = parseScope(formData);
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.agent.findUnique({ where: { id } });
  if (!existing) return { error: "Agente não encontrado." };

  if (!canWriteTenant(session, existing.tenantId)) {
    return { error: "Você não tem acesso a este agente." };
  }

  // Cliente não pode mover agente para outro tenant
  if (!session.user.isAdmin && parsed.data.tenantId !== existing.tenantId) {
    return { error: "Cliente não pode mover agente entre tenants." };
  }

  // Ao mudar de tenant (admin), precisa ter acesso ao destino também
  if (!canWriteTenant(session, parsed.data.tenantId)) {
    return { error: "Você não tem acesso ao cliente de destino." };
  }

  try {
    await prisma.agent.update({
      where: { id },
      data: {
        name: parsed.data.name,
        agentId: parsed.data.agentId,
        tenantId: parsed.data.tenantId,
        persona: parsed.data.persona || null,
        model: parsed.data.model || null,
        status: parsed.data.status,
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { fieldErrors: { agentId: "agentId já usado por outro agente." } };
    }
    return { error: "Erro ao atualizar agente." };
  }

  revalidatePath("/admin/agents");
  revalidatePath("/client/agents");
  redirectAfter(scope, parsed.data.agentId);
}

export async function deleteAgent(id: string, scope: Scope = "admin") {
  const session = await requireSession();
  const existing = await prisma.agent.findUnique({ where: { id } });
  if (!existing) return;

  if (!canWriteTenant(session, existing.tenantId)) {
    throw new Error("Acesso negado.");
  }

  await prisma.agent.delete({ where: { id } });
  revalidatePath("/admin/agents");
  revalidatePath("/client/agents");
  redirect(scope === "client" ? "/client/agents" : "/admin/agents");
}
