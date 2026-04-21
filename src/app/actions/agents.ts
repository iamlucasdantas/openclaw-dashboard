"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { audit } from "@/lib/audit";
import { generateHeartbeatSecret } from "@/lib/agent-status";

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

  // Slugs de skills a instalar junto (se veio de um template).
  const templateSlugsRaw = (formData.get("templateSkillSlugs") ?? "").toString();
  const templateSlugs = templateSlugsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let created;
  try {
    created = await prisma.agent.create({
      data: {
        name: parsed.data.name,
        agentId: parsed.data.agentId,
        tenantId: parsed.data.tenantId,
        persona: parsed.data.persona || null,
        model: parsed.data.model || null,
        status: parsed.data.status,
        heartbeatSecret: generateHeartbeatSecret(),
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

  // Instala as skills sugeridas pelo template, se existirem no catálogo.
  if (templateSlugs.length > 0) {
    const skills = await prisma.skill.findMany({
      where: { slug: { in: templateSlugs } },
      select: { id: true, slug: true },
    });
    if (skills.length > 0) {
      await prisma.agentSkill.createMany({
        data: skills.map((sk) => ({
          agentId: created.id,
          skillId: sk.id,
          enabled: true,
        })),
      });
    }
  }

  await audit({
    action: "agent.create",
    entityType: "agent",
    entityId: created.id,
    meta: {
      scope,
      agentId: created.agentId,
      name: created.name,
      tenantId: created.tenantId,
    },
  });

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

  if (!session.user.isAdmin && parsed.data.tenantId !== existing.tenantId) {
    return { error: "Cliente não pode mover agente entre tenants." };
  }

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

  await audit({
    action: "agent.update",
    entityType: "agent",
    entityId: id,
    meta: {
      scope,
      before: {
        agentId: existing.agentId,
        name: existing.name,
        tenantId: existing.tenantId,
        status: existing.status,
        model: existing.model,
      },
      after: {
        agentId: parsed.data.agentId,
        name: parsed.data.name,
        tenantId: parsed.data.tenantId,
        status: parsed.data.status,
        model: parsed.data.model || null,
      },
    },
  });

  revalidatePath("/admin/agents");
  revalidatePath("/client/agents");
  redirectAfter(scope, parsed.data.agentId);
}

export async function rotateAgentSecret(id: string, scope: Scope = "admin") {
  const session = await requireSession();
  const existing = await prisma.agent.findUnique({ where: { id } });
  if (!existing) throw new Error("Agente não encontrado.");
  if (!canWriteTenant(session, existing.tenantId)) {
    throw new Error("Acesso negado.");
  }

  const secret = generateHeartbeatSecret();
  await prisma.agent.update({ where: { id }, data: { heartbeatSecret: secret } });

  await audit({
    action: "agent.rotate_secret",
    entityType: "agent",
    entityId: id,
    meta: { scope, agentId: existing.agentId },
  });

  revalidatePath(`/admin/agents/${existing.agentId}`);
  revalidatePath(`/client/agents/${existing.agentId}`);
}

export async function deleteAgent(id: string, scope: Scope = "admin") {
  const session = await requireSession();
  const existing = await prisma.agent.findUnique({ where: { id } });
  if (!existing) return;

  if (!canWriteTenant(session, existing.tenantId)) {
    throw new Error("Acesso negado.");
  }

  await prisma.agent.delete({ where: { id } });
  await audit({
    action: "agent.delete",
    entityType: "agent",
    entityId: id,
    meta: {
      scope,
      agentId: existing.agentId,
      name: existing.name,
      tenantId: existing.tenantId,
    },
  });

  revalidatePath("/admin/agents");
  revalidatePath("/client/agents");
  redirect(scope === "client" ? "/client/agents" : "/admin/agents");
}
