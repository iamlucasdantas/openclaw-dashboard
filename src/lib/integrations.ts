// "Integrações" no vocabulário do cliente = skills da categoria "integration"
// (as que conectam o assistente a serviços externos: Gmail, GitHub, etc.)
// Este módulo expõe helpers que filtram skills pela categoria e agregam
// atividades por integração.

import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/costs";
import { filterRelevantActivities } from "@/lib/activity-relevance";

export async function listIntegrations(tenantIds?: string[]) {
  const start = startOfDay();

  const skills = await prisma.skill.findMany({
    where: { category: "integration" },
    orderBy: [{ name: "asc" }],
    include: {
      installations: {
        where: tenantIds ? { agent: { tenantId: { in: tenantIds } } } : undefined,
        include: {
          agent: { include: { tenant: true } },
          activities: {
            select: {
              summary: true,
              body: true,
              contentUrl: true,
              occurredAt: true,
            },
          },
        },
      },
    },
  });

  return skills
    .map((s) => {
      const installs = s.installations.map((i) => {
        const relevantActivities = filterRelevantActivities(i.activities);
        const todayRelevantActivities = relevantActivities.filter(
          (a) => a.occurredAt >= start
        );

        return {
          ...i,
          relevantActivities,
          todayRelevantActivities,
        };
      });

      const agentsCount = installs.length;
      const totalActivities = installs.reduce(
        (acc, i) => acc + i.relevantActivities.length,
        0
      );
      const todayActivities = installs.reduce(
        (acc, i) => acc + i.todayRelevantActivities.length,
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

  return {
    ...skill,
    installations: skill.installations.map((i) => ({
      ...i,
      activities: filterRelevantActivities(i.activities),
    })),
  };
}
