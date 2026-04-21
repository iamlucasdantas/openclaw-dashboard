// "Integrações" no vocabulário do cliente = skills da categoria "integration"
// (as que conectam o assistente a serviços externos: Gmail, GitHub, etc.)
// Este módulo expõe helpers que filtram skills pela categoria e agregam
// atividades por integração.

import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/costs";

export async function listIntegrations(tenantIds?: string[]) {
  const skills = await prisma.skill.findMany({
    where: { category: "integration" },
    orderBy: [{ name: "asc" }],
    include: {
      installations: {
        where: tenantIds ? { agent: { tenantId: { in: tenantIds } } } : undefined,
        include: {
          agent: { include: { tenant: true } },
          _count: { select: { activities: true } },
        },
      },
    },
  });

  // Atividades de hoje por skill (uma query separada agregada)
  const start = startOfDay();
  const todayAgg = await prisma.skillActivity.groupBy({
    by: ["agentSkillId"],
    where: {
      occurredAt: { gte: start },
      ...(tenantIds
        ? { agentSkill: { agent: { tenantId: { in: tenantIds } } } }
        : {}),
    },
    _count: { _all: true },
  });
  const todayByAsk = new Map(
    todayAgg.map((r) => [r.agentSkillId, r._count._all])
  );

  return skills
    .map((s) => {
      const installs = s.installations;
      const agentsCount = installs.length;
      const totalActivities = installs.reduce(
        (acc, i) => acc + i._count.activities,
        0
      );
      const todayActivities = installs.reduce(
        (acc, i) => acc + (todayByAsk.get(i.id) ?? 0),
        0
      );
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        version: s.version,
        agentsCount,
        totalActivities,
        todayActivities,
        agents: installs.map((i) => ({
          id: i.agent.id,
          agentId: i.agent.agentId,
          name: i.agent.name,
          tenantName: i.agent.tenant.name,
          tenantSlug: i.agent.tenant.slug,
          enabled: i.enabled,
        })),
      };
    })
    .sort((a, b) => b.totalActivities - a.totalActivities);
}

export async function getIntegrationDetail(
  slug: string,
  tenantIds?: string[]
) {
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      installations: {
        where: tenantIds ? { agent: { tenantId: { in: tenantIds } } } : undefined,
        include: {
          agent: { include: { tenant: true } },
          activities: {
            orderBy: { occurredAt: "desc" },
            take: 80,
          },
        },
      },
    },
  });
  if (!skill || skill.category !== "integration") return null;
  return skill;
}
