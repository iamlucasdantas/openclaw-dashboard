"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { audit } from "@/lib/audit";

const MODES = ["gh-cli", "mcp", "api"] as const;
const SCOPES = ["read", "issues", "prs", "admin"] as const;
const ROLES = ["read", "write", "admin"] as const;

const integrationSchema = z.object({
  mode: z.enum(MODES),
  scope: z.enum(SCOPES),
  org: z.string().trim().max(100).optional().or(z.literal("")),
  defaultBranch: z.string().trim().max(100).optional().or(z.literal("")),
  token: z.string().trim().max(300).optional().or(z.literal("")),
});

const repoSchema = z.object({
  owner: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*$/, "Owner inválido"),
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, "Nome de repo inválido"),
  role: z.enum(ROLES),
});

export type GithubFormState = {
  error?: string | null;
  fieldErrors?: Record<string, string>;
  success?: string | null;
};

type Scope = "admin" | "client";

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

function revalidateAgentPaths(agentId: string) {
  revalidatePath(`/admin/agents/${agentId}`);
  revalidatePath(`/client/agents/${agentId}`);
  revalidatePath("/admin/github");
}

export async function saveGithubIntegration(
  agentDbId: string,
  scope: Scope,
  _prev: GithubFormState,
  formData: FormData
): Promise<GithubFormState> {
  const { agent } = await requireAgentWrite(agentDbId);

  const parsed = integrationSchema.safeParse({
    mode: formData.get("mode"),
    scope: formData.get("scope"),
    org: formData.get("org") ?? "",
    defaultBranch: formData.get("defaultBranch") ?? "",
    token: formData.get("token") ?? "",
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const tokenPreview =
    parsed.data.token && parsed.data.token.length >= 4
      ? parsed.data.token.slice(-4)
      : undefined;

  const data = {
    mode: parsed.data.mode,
    scope: parsed.data.scope,
    org: parsed.data.org || null,
    defaultBranch: parsed.data.defaultBranch || null,
    ...(tokenPreview !== undefined ? { tokenPreview } : {}),
  };

  const existing = await prisma.githubIntegration.findUnique({
    where: { agentId: agent.id },
  });

  if (existing) {
    await prisma.githubIntegration.update({
      where: { id: existing.id },
      data,
    });
    await audit({
      action: "github.update",
      entityType: "github_integration",
      entityId: existing.id,
      meta: {
        agentId: agent.agentId,
        ...data,
        tokenReplaced: tokenPreview !== undefined,
      },
    });
  } else {
    const created = await prisma.githubIntegration.create({
      data: { ...data, agentId: agent.id },
    });
    await audit({
      action: "github.create",
      entityType: "github_integration",
      entityId: created.id,
      meta: { agentId: agent.agentId, ...data },
    });
  }

  revalidateAgentPaths(agent.agentId);
  return { success: "Integração GitHub salva." };
}

export async function removeGithubIntegration(
  agentDbId: string,
  _scope: Scope
) {
  const { agent } = await requireAgentWrite(agentDbId);
  const existing = await prisma.githubIntegration.findUnique({
    where: { agentId: agent.id },
  });
  if (!existing) return;

  await prisma.githubIntegration.delete({ where: { id: existing.id } });
  await audit({
    action: "github.remove",
    entityType: "github_integration",
    entityId: existing.id,
    meta: { agentId: agent.agentId },
  });

  revalidateAgentPaths(agent.agentId);
}

export async function addGithubRepo(
  agentDbId: string,
  _scope: Scope,
  _prev: GithubFormState,
  formData: FormData
): Promise<GithubFormState> {
  const { agent } = await requireAgentWrite(agentDbId);
  const integration = await prisma.githubIntegration.findUnique({
    where: { agentId: agent.id },
  });
  if (!integration) return { error: "Configure a integração GitHub antes." };

  const parsed = repoSchema.safeParse({
    owner: formData.get("owner"),
    name: formData.get("name"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    const created = await prisma.githubRepo.create({
      data: { ...parsed.data, integrationId: integration.id },
    });
    await audit({
      action: "github.repo.add",
      entityType: "github_repo",
      entityId: created.id,
      meta: {
        agentId: agent.agentId,
        owner: created.owner,
        name: created.name,
        role: created.role,
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { error: "Este repositório já está vinculado." };
    }
    return { error: "Erro ao adicionar repositório." };
  }

  revalidateAgentPaths(agent.agentId);
  return { success: "Repositório vinculado." };
}

export async function removeGithubRepo(repoId: string, _scope: Scope) {
  const session = await requireSession();
  const repo = await prisma.githubRepo.findUnique({
    where: { id: repoId },
    include: { integration: { include: { agent: true } } },
  });
  if (!repo) return;
  const agent = repo.integration.agent;
  if (
    !session.user.isAdmin &&
    !(session.user.tenantIds ?? []).includes(agent.tenantId)
  ) {
    throw new Error("Acesso negado.");
  }

  await prisma.githubRepo.delete({ where: { id: repoId } });
  await audit({
    action: "github.repo.remove",
    entityType: "github_repo",
    entityId: repoId,
    meta: {
      agentId: agent.agentId,
      owner: repo.owner,
      name: repo.name,
    },
  });

  revalidateAgentPaths(agent.agentId);
}
