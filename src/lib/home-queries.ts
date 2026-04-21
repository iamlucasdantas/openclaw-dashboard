import { prisma } from "@/lib/prisma";
import { effectiveStatus, humanStatusKey } from "@/lib/agent-status";
import { startOfDay, startOfMonth } from "@/lib/costs";
import { nextRunsFor } from "@/lib/schedule";
import type { EffectiveStatus } from "@/lib/agent-status";

// ———————— "Hoje" ————————

export type TodayGroup = {
  skillSlug: string;
  count: number;
  worstStatus: "ok" | "warning" | "error";
  hasIssue: boolean;
};

export type TodayEntry = {
  agent: {
    id: string;
    agentId: string;
    name: string;
    tenantName: string;
  };
  groups: TodayGroup[];
};

export async function todayDigest(tenantIds: string[]): Promise<TodayEntry[]> {
  if (tenantIds.length === 0) return [];
  const start = startOfDay();

  const agents = await prisma.agent.findMany({
    where: { tenantId: { in: tenantIds } },
    include: {
      tenant: { select: { name: true } },
      skills: {
        include: {
          skill: { select: { slug: true } },
          activities: {
            where: { occurredAt: { gte: start } },
            select: { status: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return agents.map((a) => {
    const groups: TodayGroup[] = [];
    for (const s of a.skills) {
      const acts = s.activities;
      if (acts.length === 0) continue;
      const hasError = acts.some((x) => x.status === "error");
      const hasWarn = acts.some((x) => x.status === "warning");
      groups.push({
        skillSlug: s.skill.slug,
        count: acts.length,
        worstStatus: hasError ? "error" : hasWarn ? "warning" : "ok",
        hasIssue: hasError || hasWarn,
      });
    }
    // ordena por contagem desc — mais relevante primeiro
    groups.sort((x, y) => y.count - x.count);
    return {
      agent: {
        id: a.id,
        agentId: a.agentId,
        name: a.name,
        tenantName: a.tenant.name,
      },
      groups,
    };
  });
}

// ———————— Próxima tarefa ————————

export type NextTask = {
  cronId: string;
  name: string;
  when: Date;
  agent: { agentId: string; name: string };
};

export async function nextTask(tenantIds: string[]): Promise<NextTask | null> {
  if (tenantIds.length === 0) return null;
  const crons = await prisma.agentCron.findMany({
    where: {
      state: "active",
      agent: { tenantId: { in: tenantIds } },
    },
    include: { agent: { select: { agentId: true, name: true } } },
  });

  let soonest: NextTask | null = null;
  for (const c of crons) {
    const runs = nextRunsFor(c.schedule, 1);
    const t = runs[0];
    if (!t) continue;
    if (!soonest || t.getTime() < soonest.when.getTime()) {
      soonest = {
        cronId: c.id,
        name: c.name,
        when: t,
        agent: c.agent,
      };
    }
  }
  return soonest;
}

// ———————— Orçamento do mês ————————

export type BudgetSnapshot = {
  spentUsd: number;
  budgetUsd: number | null; // soma dos limites mensais dos tenants
  projectionUsd: number; // projeção linear de fim de mês
  pctOfBudget: number | null;
};

export async function budgetSnapshot(
  tenantIds: string[]
): Promise<BudgetSnapshot> {
  if (tenantIds.length === 0) {
    return { spentUsd: 0, budgetUsd: null, projectionUsd: 0, pctOfBudget: null };
  }

  const [spentAgg, tenants, agents] = await Promise.all([
    prisma.usageEvent.aggregate({
      where: {
        agent: { tenantId: { in: tenantIds } },
        occurredAt: { gte: startOfMonth() },
      },
      _sum: { costUsd: true },
    }),
    prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { monthlyBudgetUsd: true },
    }),
    // Também considera budgets de agentes (somados aos dos tenants).
    prisma.agent.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { monthlyBudgetUsd: true },
    }),
  ]);

  const spentUsd = spentAgg._sum.costUsd ?? 0;

  // Projeção linear: spent * (daysInMonth / daysElapsed).
  const now = new Date();
  const daysElapsed = now.getDate(); // dias decorridos no mês (inclui hoje)
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const projectionUsd =
    daysElapsed > 0 ? (spentUsd / daysElapsed) * daysInMonth : spentUsd;

  const tenantBudget = tenants.reduce(
    (s, t) => s + (t.monthlyBudgetUsd ?? 0),
    0
  );
  const agentBudget = agents.reduce(
    (s, a) => s + (a.monthlyBudgetUsd ?? 0),
    0
  );
  const totalBudget = tenantBudget > 0 ? tenantBudget : agentBudget;

  return {
    spentUsd,
    budgetUsd: totalBudget > 0 ? totalBudget : null,
    projectionUsd,
    pctOfBudget:
      totalBudget > 0 ? Math.round((spentUsd / totalBudget) * 100) : null,
  };
}

// ———————— Meus assistentes (cards) ————————

export type AssistantCard = {
  id: string;
  agentId: string;
  name: string;
  tenantName: string;
  status: EffectiveStatus;
  humanStatus: "working" | "quiet" | "attention" | "stopped";
  skillsCount: number;
  tasksToday: number;
};

export async function myAssistantsSummary(
  tenantIds: string[]
): Promise<AssistantCard[]> {
  if (tenantIds.length === 0) return [];
  const start = startOfDay();

  const agents = await prisma.agent.findMany({
    where: { tenantId: { in: tenantIds } },
    include: {
      tenant: { select: { name: true } },
      _count: { select: { skills: true } },
      skills: {
        select: {
          activities: {
            where: { occurredAt: { gte: start } },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return agents.map((a) => {
    const tasksToday = a.skills.reduce(
      (s, sk) => s + sk.activities.length,
      0
    );
    const status = effectiveStatus(a);
    return {
      id: a.id,
      agentId: a.agentId,
      name: a.name,
      tenantName: a.tenant.name,
      status,
      humanStatus: humanStatusKey(status),
      skillsCount: a._count.skills,
      tasksToday,
    };
  });
}

// ———————— Headline agregado ————————

export type HealthHeadline = {
  kind: "allWorking" | "someAttention" | "someStopped";
  count: number;
};

export function computeHeadline(
  assistants: AssistantCard[]
): HealthHeadline {
  if (assistants.length === 0) {
    return { kind: "allWorking", count: 0 };
  }
  const stopped = assistants.filter((a) => a.humanStatus === "stopped").length;
  const attention = assistants.filter((a) => a.humanStatus === "attention").length;
  if (stopped > 0) return { kind: "someStopped", count: stopped };
  if (attention > 0) return { kind: "someAttention", count: attention };
  return { kind: "allWorking", count: assistants.length };
}
