import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Retorna entidades buscáveis. Escopa por tenant quando não é admin,
// e separa por tipo pro palette agrupar visualmente.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.isAdmin;
  const tenantIds = session.user.tenantIds ?? [];

  const [agents, tenants, skills, crons, campaigns] = await Promise.all([
    prisma.agent.findMany({
      where: isAdmin ? undefined : { tenantId: { in: tenantIds } },
      select: {
        agentId: true,
        name: true,
        tenant: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    isAdmin
      ? prisma.tenant.findMany({
          select: { slug: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.skill.findMany({
      select: { id: true, name: true, slug: true, category: true },
      orderBy: { name: "asc" },
    }),
    prisma.agentCron.findMany({
      where: isAdmin ? undefined : { agent: { tenantId: { in: tenantIds } } },
      select: {
        id: true,
        name: true,
        agent: { select: { agentId: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.prospectingCampaign.findMany({
      where: isAdmin ? undefined : { tenantId: { in: tenantIds } },
      select: {
        id: true,
        name: true,
        tenant: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const scope = isAdmin ? "admin" : "client";

  return NextResponse.json({
    agents: agents.map((a) => ({
      type: "agent" as const,
      label: a.name,
      hint: a.tenant.name,
      href: `/${scope}/agents/${a.agentId}`,
    })),
    tenants: tenants.map((t) => ({
      type: "tenant" as const,
      label: t.name,
      hint: t.slug,
      href: `/admin/tenants/${t.slug}`,
    })),
    skills: skills.map((s) => ({
      type: "skill" as const,
      label: s.name,
      hint: s.category,
      href: `/${scope}/skills/${s.id}`,
    })),
    crons: crons.map((c) => ({
      type: "cron" as const,
      label: c.name,
      hint: c.agent.name,
      href: `/${scope}/agents/${c.agent.agentId}`,
    })),
    campaigns: campaigns.map((c) => ({
      type: "campaign" as const,
      label: c.name,
      hint: c.tenant.name,
      href: `/${scope}/prospecting/${c.id}`,
    })),
    navigation: navFor(scope),
  });
}

function navFor(scope: "admin" | "client") {
  if (scope === "admin") {
    return [
      { label: "Visão geral", href: "/admin" },
      { label: "Clientes", href: "/admin/tenants" },
      { label: "Agentes", href: "/admin/agents" },
      { label: "Integrações", href: "/admin/integrations" },
      { label: "Prospecção", href: "/admin/prospecting" },
      { label: "GitHub", href: "/admin/github" },
      { label: "Habilidades", href: "/admin/skills" },
      { label: "Agendamentos", href: "/admin/crons" },
      { label: "Custos", href: "/admin/costs" },
      { label: "Usuários", href: "/admin/users" },
      { label: "Convites", href: "/admin/invites" },
      { label: "Auditoria", href: "/admin/audit" },
    ].map((n) => ({ type: "nav" as const, label: n.label, href: n.href }));
  }
  return [
    { label: "Início", href: "/client" },
    { label: "Meus assistentes", href: "/client/agents" },
    { label: "Integrações", href: "/client/integrations" },
    { label: "Prospecção", href: "/client/prospecting" },
    { label: "Agenda", href: "/client/crons" },
    { label: "Faturamento", href: "/client/costs" },
    { label: "Minha conta", href: "/client/profile" },
  ].map((n) => ({ type: "nav" as const, label: n.label, href: n.href }));
}
