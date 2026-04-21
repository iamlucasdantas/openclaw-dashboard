"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { audit } from "@/lib/audit";

type Scope = "admin" | "client";

// Regex simples: 5 campos cron ou @hourly/@daily/@weekly/@monthly
const scheduleRegex =
  /^(@(hourly|daily|weekly|monthly)|(\*|[0-9,\-*/]+)(\s+(\*|[0-9,\-*/]+)){4})$/;

const cronSchema = z.object({
  agentDbId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  schedule: z
    .string()
    .trim()
    .regex(scheduleRegex, "Formato inválido. Use cron de 5 campos ou @hourly/@daily/@weekly/@monthly"),
  command: z.string().trim().min(1).max(400),
  state: z.enum(["active", "paused", "disabled"]).default("active"),
});

export type CronFormState = {
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

function parseForm(formData: FormData) {
  return cronSchema.safeParse({
    agentDbId: formData.get("agentDbId"),
    name: formData.get("name"),
    schedule: formData.get("schedule"),
    command: formData.get("command"),
    state: formData.get("state") ?? "active",
  });
}

function cronRedirect(scope: Scope, agentId: string): never {
  redirect(scope === "client" ? `/client/agents/${agentId}` : `/admin/agents/${agentId}`);
}

export async function createCron(
  scope: Scope,
  _prev: CronFormState,
  formData: FormData
): Promise<CronFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { agent } = await requireAgentWrite(parsed.data.agentDbId);

  const created = await prisma.agentCron.create({
    data: {
      agentId: agent.id,
      name: parsed.data.name,
      schedule: parsed.data.schedule,
      command: parsed.data.command,
      state: parsed.data.state,
    },
  });
  await audit({
    action: "cron.create",
    entityType: "cron",
    entityId: created.id,
    meta: {
      agentId: agent.agentId,
      name: created.name,
      schedule: created.schedule,
    },
  });

  revalidatePath(`/admin/agents/${agent.agentId}`);
  revalidatePath(`/client/agents/${agent.agentId}`);
  revalidatePath("/admin/crons");
  cronRedirect(scope, agent.agentId);
}

export async function updateCron(
  id: string,
  scope: Scope,
  _prev: CronFormState,
  formData: FormData
): Promise<CronFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.agentCron.findUnique({
    where: { id },
    include: { agent: true },
  });
  if (!existing) return { error: "Cron não encontrado." };

  const session = await requireSession();
  if (
    !session.user.isAdmin &&
    !(session.user.tenantIds ?? []).includes(existing.agent.tenantId)
  ) {
    return { error: "Acesso negado." };
  }

  await prisma.agentCron.update({
    where: { id },
    data: {
      name: parsed.data.name,
      schedule: parsed.data.schedule,
      command: parsed.data.command,
      state: parsed.data.state,
    },
  });
  await audit({
    action: "cron.update",
    entityType: "cron",
    entityId: id,
    meta: {
      agentId: existing.agent.agentId,
      name: parsed.data.name,
      schedule: parsed.data.schedule,
    },
  });

  revalidatePath(`/admin/agents/${existing.agent.agentId}`);
  revalidatePath(`/client/agents/${existing.agent.agentId}`);
  revalidatePath("/admin/crons");
  cronRedirect(scope, existing.agent.agentId);
}

export async function toggleCronState(id: string, nextState: "active" | "paused") {
  const existing = await prisma.agentCron.findUnique({
    where: { id },
    include: { agent: true },
  });
  if (!existing) return;

  const session = await requireSession();
  if (
    !session.user.isAdmin &&
    !(session.user.tenantIds ?? []).includes(existing.agent.tenantId)
  ) {
    throw new Error("Acesso negado.");
  }

  await prisma.agentCron.update({ where: { id }, data: { state: nextState } });
  await audit({
    action: `cron.${nextState === "active" ? "resume" : "pause"}`,
    entityType: "cron",
    entityId: id,
    meta: { agentId: existing.agent.agentId, name: existing.name },
  });

  revalidatePath(`/admin/agents/${existing.agent.agentId}`);
  revalidatePath(`/client/agents/${existing.agent.agentId}`);
  revalidatePath("/admin/crons");
}

// Remove tarefas duplicadas (mesmo agentId + name + schedule) mantendo a
// mais recente. Usado pelo banner de "duplicatas detectadas" em /admin/crons.
export async function deleteDuplicatedCrons() {
  const session = await requireSession();
  if (!session.user.isAdmin) throw new Error("Acesso negado.");

  const all = await prisma.agentCron.findMany({
    select: {
      id: true,
      agentId: true,
      name: true,
      schedule: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Set<string>();
  const toDelete: string[] = [];
  for (const c of all) {
    const k = `${c.agentId}::${c.name}::${c.schedule}`;
    if (seen.has(k)) toDelete.push(c.id);
    else seen.add(k);
  }

  if (toDelete.length === 0) return { deleted: 0 };

  await prisma.agentCron.deleteMany({ where: { id: { in: toDelete } } });

  await audit({
    action: "cron.dedupe",
    entityType: "cron",
    entityId: "bulk",
    meta: { removed: toDelete.length },
  });

  revalidatePath("/admin/crons");
  return { deleted: toDelete.length };
}

export async function deleteCron(id: string) {
  const existing = await prisma.agentCron.findUnique({
    where: { id },
    include: { agent: true },
  });
  if (!existing) return;

  const session = await requireSession();
  if (
    !session.user.isAdmin &&
    !(session.user.tenantIds ?? []).includes(existing.agent.tenantId)
  ) {
    throw new Error("Acesso negado.");
  }

  await prisma.agentCron.delete({ where: { id } });
  await audit({
    action: "cron.delete",
    entityType: "cron",
    entityId: id,
    meta: { agentId: existing.agent.agentId, name: existing.name },
  });

  revalidatePath(`/admin/agents/${existing.agent.agentId}`);
  revalidatePath(`/client/agents/${existing.agent.agentId}`);
  revalidatePath("/admin/crons");
}
