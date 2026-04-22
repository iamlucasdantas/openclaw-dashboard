import { prisma } from "@/lib/prisma";
import { nextRunsFor } from "@/lib/schedule";
import { isRelevantActivity } from "@/lib/activity-relevance";

const DASHBOARD_TIMEZONE = "America/Chicago";

function zonedStartOfDay(date = new Date(), timeZone = DASHBOARD_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const asTzLocal = new Date(utcGuess.toLocaleString("en-US", { timeZone }));
  const diffMs = utcGuess.getTime() - asTzLocal.getTime();
  return new Date(utcGuess.getTime() + diffMs);
}

// Contagem de atividades para os 3 cards de topo.
export async function activityCounts(agentDbId: string) {
  const now = new Date();
  const startToday = zonedStartOfDay(now);
  const start7 = new Date(now);
  start7.setDate(start7.getDate() - 7);
  const start30 = new Date(now);
  start30.setDate(start30.getDate() - 30);

  const [today, week, month] = await Promise.all([
    prisma.skillActivity.count({
      where: {
        agentSkill: { agentId: agentDbId },
        occurredAt: { gte: startToday },
      },
    }),
    prisma.skillActivity.count({
      where: {
        agentSkill: { agentId: agentDbId },
        occurredAt: { gte: start7 },
      },
    }),
    prisma.skillActivity.count({
      where: {
        agentSkill: { agentId: agentDbId },
        occurredAt: { gte: start30 },
      },
    }),
  ]);

  return { today, week, month };
}

// Próximas N tarefas do agente, ordenadas por horário.
export async function upcomingTasksForAgent(agentDbId: string, count = 5) {
  const crons = await prisma.agentCron.findMany({
    where: { agentId: agentDbId, state: "active" },
  });

  const acc: { cronId: string; name: string; when: Date }[] = [];
  for (const c of crons) {
    for (const t of nextRunsFor(c.schedule, 3)) {
      acc.push({ cronId: c.id, name: c.name, when: t });
    }
  }
  return acc
    .sort((a, b) => a.when.getTime() - b.when.getTime())
    .slice(0, count);
}

// Linha do tempo de atividades do agente com filtro de período.
export async function activityTimeline(
  agentDbId: string,
  range: "today" | "7d" | "30d"
) {
  const now = new Date();
  let gte = new Date(now);
  if (range === "today") gte = zonedStartOfDay(now);
  if (range === "7d") gte.setDate(gte.getDate() - 7);
  if (range === "30d") gte.setDate(gte.getDate() - 30);

  const activities = await prisma.skillActivity.findMany({
    where: {
      agentSkill: { agentId: agentDbId },
      occurredAt: { gte },
    },
    orderBy: { occurredAt: "desc" },
    take: 400,
    include: {
      agentSkill: { include: { skill: true } },
    },
  });

  return activities.filter(isRelevantActivity).slice(0, 200);
}

const TASK_NOISE_PATTERNS = [
  "aguardando aprovação",
  "aguardando ok",
  "enviado para lucas",
  "enviado pro lucas",
  "enviado pra aprovação",
  "sent to lucas via telegram",
  "sent to lucas",
  "for approval",
  "already completed before interruption",
  "task was already completed before interruption",
  "post já enviado para lucas aprovar",
  "aprova para publicar",
  "aqui está o resumo",
  "here is the summary",
  "resumo da tarefa concluída",
];

function parseDeliverableData(value: string | null) {
  if (!value) return {} as Record<string, any>;
  try {
    return JSON.parse(value) as Record<string, any>;
  } catch {
    return {} as Record<string, any>;
  }
}

function isVisibleDeliverableTask(task: any) {
  const dd = parseDeliverableData(task.deliverableData);
  const text = [
    task.title,
    task.result,
    dd.title,
    dd.content,
    dd.caption,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("prep") || text.includes("planejamento")) return false;
  if (TASK_NOISE_PATTERNS.some((pattern) => text.includes(pattern))) return false;

  return true;
}

export async function taskTimeline(
  agentDbId: string,
  range: "today" | "7d" | "30d"
) {
  const now = new Date();
  let gte = new Date(now);
  if (range === "today") gte = zonedStartOfDay(now);
  if (range === "7d") gte.setDate(gte.getDate() - 7);
  if (range === "30d") gte.setDate(gte.getDate() - 30);

  const tasks = await prisma.task.findMany({
    where: {
      agentId: agentDbId,
      startedAt: { gte },
    },
    orderBy: { startedAt: "desc" },
    take: 150,
    include: {
      _count: { select: { activities: true } },
      activities: {
        orderBy: { occurredAt: "asc" },
        select: {
          id: true,
          summary: true,
          body: true,
          contentType: true,
          contentUrl: true,
          status: true,
          occurredAt: true,
        },
      },
      agent: {
        select: { agentId: true, name: true },
      },
    },
  });

  return tasks.filter(isVisibleDeliverableTask).slice(0, 100);
}
