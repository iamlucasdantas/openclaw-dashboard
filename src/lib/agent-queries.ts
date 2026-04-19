import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/costs";
import { nextRunsFor } from "@/lib/schedule";

// Contagem de atividades para os 3 cards de topo.
export async function activityCounts(agentDbId: string) {
  const now = new Date();
  const startToday = startOfDay(now);
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
  if (range === "today") gte = startOfDay(now);
  if (range === "7d") gte.setDate(gte.getDate() - 7);
  if (range === "30d") gte.setDate(gte.getDate() - 30);

  const activities = await prisma.skillActivity.findMany({
    where: {
      agentSkill: { agentId: agentDbId },
      occurredAt: { gte },
    },
    orderBy: { occurredAt: "desc" },
    take: 200,
    include: {
      agentSkill: { include: { skill: true } },
    },
  });

  return activities;
}
