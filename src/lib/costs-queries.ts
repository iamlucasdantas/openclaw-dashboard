import { prisma } from "@/lib/prisma";
import { startOfDay, startOfMonth, startOfWeek } from "@/lib/costs";

export type CostSummary = {
  today: number;
  week: number;
  month: number;
  totalTokensMonth: number;
};

export async function costSummaryForAgents(agentIds?: string[]): Promise<CostSummary> {
  const whereBase = agentIds ? { agentId: { in: agentIds } } : {};
  const [today, week, month] = await Promise.all([
    prisma.usageEvent.aggregate({
      where: { ...whereBase, occurredAt: { gte: startOfDay() } },
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
    }),
    prisma.usageEvent.aggregate({
      where: { ...whereBase, occurredAt: { gte: startOfWeek() } },
      _sum: { costUsd: true },
    }),
    prisma.usageEvent.aggregate({
      where: { ...whereBase, occurredAt: { gte: startOfMonth() } },
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
    }),
  ]);

  return {
    today: today._sum.costUsd ?? 0,
    week: week._sum.costUsd ?? 0,
    month: month._sum.costUsd ?? 0,
    totalTokensMonth:
      (month._sum.inputTokens ?? 0) + (month._sum.outputTokens ?? 0),
  };
}

export async function costByAgentThisMonth(agentIds?: string[]) {
  const rows = await prisma.usageEvent.groupBy({
    by: ["agentId"],
    where: {
      occurredAt: { gte: startOfMonth() },
      ...(agentIds ? { agentId: { in: agentIds } } : {}),
    },
    _sum: { costUsd: true, inputTokens: true, outputTokens: true },
  });

  const agents = await prisma.agent.findMany({
    where: { id: { in: rows.map((r) => r.agentId) } },
    include: { tenant: true },
  });
  const byId = new Map(agents.map((a) => [a.id, a]));

  return rows
    .map((r) => {
      const a = byId.get(r.agentId);
      return {
        agentDbId: r.agentId,
        agentId: a?.agentId ?? r.agentId,
        name: a?.name ?? "—",
        tenantName: a?.tenant.name ?? "—",
        tenantSlug: a?.tenant.slug,
        costUsd: r._sum.costUsd ?? 0,
        tokens: (r._sum.inputTokens ?? 0) + (r._sum.outputTokens ?? 0),
      };
    })
    .sort((a, b) => b.costUsd - a.costUsd);
}

export async function costByTenantThisMonth(tenantIds?: string[]) {
  // precisa de join: agrupar por agentId primeiro, depois somar por tenant
  const rows = await prisma.usageEvent.groupBy({
    by: ["agentId"],
    where: { occurredAt: { gte: startOfMonth() } },
    _sum: { costUsd: true, inputTokens: true, outputTokens: true },
  });
  const agents = await prisma.agent.findMany({
    where: {
      id: { in: rows.map((r) => r.agentId) },
      ...(tenantIds ? { tenantId: { in: tenantIds } } : {}),
    },
    include: { tenant: true },
  });
  const byAgent = new Map(rows.map((r) => [r.agentId, r]));

  const map = new Map<
    string,
    { tenantId: string; name: string; slug: string; costUsd: number; tokens: number }
  >();
  for (const a of agents) {
    const r = byAgent.get(a.id);
    if (!r) continue;
    const current = map.get(a.tenantId) ?? {
      tenantId: a.tenantId,
      name: a.tenant.name,
      slug: a.tenant.slug,
      costUsd: 0,
      tokens: 0,
    };
    current.costUsd += r._sum.costUsd ?? 0;
    current.tokens += (r._sum.inputTokens ?? 0) + (r._sum.outputTokens ?? 0);
    map.set(a.tenantId, current);
  }

  return Array.from(map.values()).sort((a, b) => b.costUsd - a.costUsd);
}

export async function costByDayThisMonth(agentIds?: string[]) {
  const events = await prisma.usageEvent.findMany({
    where: {
      occurredAt: { gte: startOfMonth() },
      ...(agentIds ? { agentId: { in: agentIds } } : {}),
    },
    select: { occurredAt: true, costUsd: true },
  });
  const map = new Map<string, number>();
  for (const e of events) {
    const key = e.occurredAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + e.costUsd);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, costUsd]) => ({ date, costUsd }));
}
