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
        budgetUsd: a?.monthlyBudgetUsd ?? null,
      };
    })
    .sort((a, b) => b.costUsd - a.costUsd);
}

export async function costForAgentThisMonth(agentDbId: string): Promise<number> {
  const r = await prisma.usageEvent.aggregate({
    where: { agentId: agentDbId, occurredAt: { gte: startOfMonth() } },
    _sum: { costUsd: true },
  });
  return r._sum.costUsd ?? 0;
}

// Soma diária do dia atual e 6 anteriores (sempre 7 linhas).
export async function costLast7Days(agentIds?: string[]) {
  const now = new Date();
  const base = startOfDay(now);
  base.setDate(base.getDate() - 6); // inclui 7 dias
  const events = await prisma.usageEvent.findMany({
    where: {
      occurredAt: { gte: base },
      ...(agentIds ? { agentId: { in: agentIds } } : {}),
    },
    select: { occurredAt: true, costUsd: true },
  });
  const map = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const e of events) {
    const k = e.occurredAt.toISOString().slice(0, 10);
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + e.costUsd);
  }
  return Array.from(map.entries()).map(([date, costUsd]) => ({
    date,
    costUsd,
  }));
}


export async function costByTenantThisMonth(tenantIds?: string[]) {
  const rows = await prisma.usageEvent.groupBy({
    by: ["agentId"],
    where: { occurredAt: { gte: startOfMonth() } },
    _sum: { costUsd: true, inputTokens: true, outputTokens: true },
  });
  const allTenants = await prisma.tenant.findMany({
    where: tenantIds ? { id: { in: tenantIds } } : undefined,
  });
  const agents = await prisma.agent.findMany({
    where: {
      id: { in: rows.map((r) => r.agentId) },
      ...(tenantIds ? { tenantId: { in: tenantIds } } : {}),
    },
  });
  const byAgent = new Map(rows.map((r) => [r.agentId, r]));

  const baseMap = new Map<
    string,
    {
      tenantId: string;
      name: string;
      slug: string;
      costUsd: number;
      tokens: number;
      budgetUsd: number | null;
    }
  >();
  for (const t of allTenants) {
    baseMap.set(t.id, {
      tenantId: t.id,
      name: t.name,
      slug: t.slug,
      costUsd: 0,
      tokens: 0,
      budgetUsd: t.monthlyBudgetUsd,
    });
  }
  for (const a of agents) {
    const r = byAgent.get(a.id);
    if (!r) continue;
    const current = baseMap.get(a.tenantId);
    if (!current) continue;
    current.costUsd += r._sum.costUsd ?? 0;
    current.tokens += (r._sum.inputTokens ?? 0) + (r._sum.outputTokens ?? 0);
  }

  return Array.from(baseMap.values())
    .filter((t) => t.costUsd > 0 || t.budgetUsd != null)
    .sort((a, b) => b.costUsd - a.costUsd);
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
