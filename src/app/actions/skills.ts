"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth-guards";
import { audit } from "@/lib/audit";

type Scope = "admin" | "client";

const slugRegex = /^[a-z0-9][a-z0-9-]{1,60}[a-z0-9]$/;

const skillSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(slugRegex, "slug inválido"),
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  source: z.string().trim().max(40).optional().or(z.literal("")),
  version: z.string().trim().max(40).optional().or(z.literal("")),
});

export type SkillFormState = {
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[issue.path.join(".")] = issue.message;
  return out;
}

async function requireAgentWrite(agentDbId: string) {
  const session = await requireSession();
  const agent = await prisma.agent.findUnique({ where: { id: agentDbId } });
  if (!agent) throw new Error("Agente não encontrado.");
  if (
    !session.user.isAdmin &&
    !(session.user.tenantIds ?? []).includes(agent.tenantId)
  ) {
    throw new Error("Acesso negado.");
  }
  return { session, agent };
}

function parseSkill(formData: FormData) {
  return skillSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
    source: formData.get("source") ?? "",
    version: formData.get("version") ?? "",
  });
}

export async function createSkill(
  _prev: SkillFormState,
  formData: FormData
): Promise<SkillFormState> {
  await requireAdmin();
  const parsed = parseSkill(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    const created = await prisma.skill.create({
      data: {
        slug: parsed.data.slug,
        name: parsed.data.name,
        category: parsed.data.category,
        description: parsed.data.description || null,
        source: parsed.data.source || null,
        version: parsed.data.version || null,
      },
    });
    await audit({
      action: "skill.create",
      entityType: "skill",
      entityId: created.id,
      meta: { slug: created.slug, name: created.name },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { fieldErrors: { slug: "Já existe uma skill com este slug." } };
    }
    return { error: "Erro ao criar skill." };
  }

  revalidatePath("/admin/skills");
  redirect("/admin/skills");
}

export async function updateSkill(
  id: string,
  _prev: SkillFormState,
  formData: FormData
): Promise<SkillFormState> {
  await requireAdmin();
  const parsed = parseSkill(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    await prisma.skill.update({
      where: { id },
      data: {
        slug: parsed.data.slug,
        name: parsed.data.name,
        category: parsed.data.category,
        description: parsed.data.description || null,
        source: parsed.data.source || null,
        version: parsed.data.version || null,
      },
    });
    await audit({
      action: "skill.update",
      entityType: "skill",
      entityId: id,
      meta: { slug: parsed.data.slug, name: parsed.data.name },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { fieldErrors: { slug: "Slug já usado por outra skill." } };
    }
    return { error: "Erro ao atualizar skill." };
  }

  revalidatePath("/admin/skills");
  redirect("/admin/skills");
}

export async function deleteSkill(id: string) {
  await requireAdmin();
  const before = await prisma.skill.findUnique({ where: { id } });
  await prisma.skill.delete({ where: { id } });
  await audit({
    action: "skill.delete",
    entityType: "skill",
    entityId: id,
    meta: before ? { slug: before.slug, name: before.name } : null,
  });
  revalidatePath("/admin/skills");
  redirect("/admin/skills");
}

// Instalar/remover/toggle skills em um agente

export async function installSkillOnAgent(
  agentDbId: string,
  scope: Scope,
  formData: FormData
) {
  const { agent } = await requireAgentWrite(agentDbId);
  const skillId = (formData.get("skillId") ?? "").toString();
  if (!skillId) return;

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) return;

  await prisma.agentSkill.upsert({
    where: { agentId_skillId: { agentId: agent.id, skillId } },
    update: { enabled: true },
    create: { agentId: agent.id, skillId, enabled: true },
  });
  await audit({
    action: "agent_skill.install",
    entityType: "agent_skill",
    entityId: `${agent.id}:${skillId}`,
    meta: { agentId: agent.agentId, skillSlug: skill.slug },
  });

  revalidatePath(`/admin/agents/${agent.agentId}`);
  revalidatePath(`/client/agents/${agent.agentId}`);
  revalidatePath("/admin/skills");
}

export async function toggleAgentSkill(
  agentSkillId: string,
  scope: Scope,
  nextEnabled: boolean
) {
  const session = await requireSession();
  const row = await prisma.agentSkill.findUnique({
    where: { id: agentSkillId },
    include: { agent: true, skill: true },
  });
  if (!row) return;
  if (
    !session.user.isAdmin &&
    !(session.user.tenantIds ?? []).includes(row.agent.tenantId)
  ) {
    throw new Error("Acesso negado.");
  }

  await prisma.agentSkill.update({
    where: { id: agentSkillId },
    data: { enabled: nextEnabled },
  });
  await audit({
    action: nextEnabled ? "agent_skill.enable" : "agent_skill.disable",
    entityType: "agent_skill",
    entityId: agentSkillId,
    meta: { agentId: row.agent.agentId, skillSlug: row.skill.slug },
  });

  revalidatePath(`/admin/agents/${row.agent.agentId}`);
  revalidatePath(`/client/agents/${row.agent.agentId}`);
}

export async function uninstallAgentSkill(
  agentSkillId: string,
  scope: Scope
) {
  const session = await requireSession();
  const row = await prisma.agentSkill.findUnique({
    where: { id: agentSkillId },
    include: { agent: true, skill: true },
  });
  if (!row) return;
  if (
    !session.user.isAdmin &&
    !(session.user.tenantIds ?? []).includes(row.agent.tenantId)
  ) {
    throw new Error("Acesso negado.");
  }

  await prisma.agentSkill.delete({ where: { id: agentSkillId } });
  await audit({
    action: "agent_skill.uninstall",
    entityType: "agent_skill",
    entityId: agentSkillId,
    meta: { agentId: row.agent.agentId, skillSlug: row.skill.slug },
  });

  revalidatePath(`/admin/agents/${row.agent.agentId}`);
  revalidatePath(`/client/agents/${row.agent.agentId}`);
}
