"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

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

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[issue.path.join(".")] = issue.message;
  return out;
}

export async function createAgent(
  _prev: AgentFormState,
  formData: FormData
): Promise<AgentFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

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
  redirect(`/admin/agents/${parsed.data.agentId}`);
}

export async function updateAgent(
  id: string,
  _prev: AgentFormState,
  formData: FormData
): Promise<AgentFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

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
  redirect(`/admin/agents/${parsed.data.agentId}`);
}

export async function deleteAgent(id: string) {
  await requireAdmin();
  await prisma.agent.delete({ where: { id } });
  revalidatePath("/admin/agents");
  redirect("/admin/agents");
}
