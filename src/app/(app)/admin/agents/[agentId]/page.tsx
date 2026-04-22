import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { effectiveStatus } from "@/lib/agent-status";
import { costForAgentThisMonth } from "@/lib/costs-queries";
import {
  activityCounts,
  activityTimeline,
  upcomingTasksForAgent,
  taskTimeline,
} from "@/lib/agent-queries";
import { AgentHeader } from "@/components/agent-tabs/AgentHeader";
import type { TabKey } from "@/components/agent-tabs/AgentHeader";
import { TabSummary } from "@/components/agent-tabs/TabSummary";
import { TabTasks } from "@/components/agent-tabs/TabTasks";
import { TabActivity } from "@/components/agent-tabs/TabActivity";
import { TabConnections } from "@/components/agent-tabs/TabConnections";
import { TabDeveloper } from "@/components/agent-tabs/TabDeveloper";

type Range = "today" | "7d" | "30d";

export default async function AdminAgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ tab?: string; range?: string }>;
}) {
  const { agentId } = await params;
  const sp = await searchParams;
  const tab: TabKey =
    sp.tab === "tasks" ||
    sp.tab === "activity" ||
    sp.tab === "connections" ||
    sp.tab === "dev"
      ? (sp.tab as TabKey)
      : "tasks";
  const range: Range =
    sp.range === "7d" || sp.range === "30d" ? sp.range : "today";

  const [agent, skillCatalog] = await Promise.all([
    prisma.agent.findUnique({
      where: { agentId },
      include: {
        tenant: true,
        github: {
          include: {
            repos: { orderBy: [{ owner: "asc" }, { name: "asc" }] },
          },
        },
        skills: {
          include: {
            skill: true,
            activities: { orderBy: { occurredAt: "desc" }, take: 1 },
            _count: { select: { activities: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        crons: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.skill.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        description: true,
      },
    }),
  ]);

  if (!agent) notFound();

  const status = effectiveStatus(agent);
  const basePath = `/admin/agents/${agent.agentId}`;

  let tabContent: React.ReactNode;

  if (tab === "summary") {
    const [counts, usedUsd, upcoming] = await Promise.all([
      activityCounts(agent.id),
      costForAgentThisMonth(agent.id),
      upcomingTasksForAgent(agent.id, 5),
    ]);
    tabContent = (
      <TabSummary
        counts={counts}
        usedThisMonthUsd={usedUsd}
        budgetUsd={agent.monthlyBudgetUsd}
        upcoming={upcoming}
        editHref={`${basePath}/edit`}
        scheduleHref="/admin/crons"
        onDeleteAction={null}
        agentName={agent.name}
        crons={agent.crons.map((c) => ({
          id: c.id,
          name: c.name,
          schedule: c.schedule,
          state: c.state,
          nextRunAt: c.nextRunAt,
          agent: { agentId: agent.agentId, name: agent.name },
        }))}
        agentHrefPrefix="/admin/agents"
      />
    );
  } else if (tab === "tasks") {
    const raw = await taskTimeline(agent.id, range);
    const tasks = raw.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      category: t.category,
      result: t.result,
      resultType: t.resultType,
      resultUrl: t.resultUrl,
      deliverableData: t.deliverableData,
      startedAt: t.startedAt,
      resolvedAt: t.resolvedAt,
      _count: t._count,
      agent: { agentId: agent.agentId, name: agent.name },
    }));
    tabContent = (
      <TabTasks
        range={range}
        basePath={`${basePath}?tab=tasks`}
        tasks={tasks}
        agentHrefPrefix="/admin/agents"
      />
    );
  } else if (tab === "activity") {
    const raw = await activityTimeline(agent.id, range);
    const activities = raw.map((a) => ({
      id: a.id,
      summary: a.summary,
      body: a.body,
      contentType: a.contentType,
      contentUrl: a.contentUrl,
      status: a.status,
      occurredAt: a.occurredAt,
      agent: { agentId: agent.agentId, name: agent.name },
    }));
    tabContent = (
      <TabActivity
        range={range}
        basePath={`${basePath}?tab=activity`}
        activities={activities}
        agentHrefPrefix="/admin/agents"
      />
    );
  } else if (tab === "connections") {
    tabContent = (
      <TabConnections
        agentDbId={agent.id}
        scope="admin"
        skillsInstalled={agent.skills.map((s) => ({
          id: s.id,
          enabled: s.enabled,
          skill: {
            id: s.skill.id,
            slug: s.skill.slug,
            name: s.skill.name,
            category: s.skill.category,
            version: s.skill.version,
            description: s.skill.description,
          },
          lastActivity: s.activities[0]
            ? {
                summary: s.activities[0].summary,
                occurredAt: s.activities[0].occurredAt,
                status: s.activities[0].status,
              }
            : null,
          activityCount: s._count.activities,
        }))}
        skillCatalog={skillCatalog}
        crons={agent.crons}
        github={
          agent.github
            ? {
                org: agent.github.org,
                repos: agent.github.repos.map((r) => ({
                  owner: r.owner,
                  name: r.name,
                  role: r.role,
                })),
              }
            : null
        }
        githubAdvancedHref={`${basePath}?tab=dev`}
        scheduleWizardHref={`${basePath}/schedule/new`}
      />
    );
  } else {
    tabContent = (
      <TabDeveloper
        agent={agent}
        scope="admin"
        githubIntegration={
          agent.github
            ? {
                id: agent.github.id,
                mode: agent.github.mode,
                scope: agent.github.scope,
                org: agent.github.org,
                defaultBranch: agent.github.defaultBranch,
                tokenPreview: agent.github.tokenPreview,
                repos: agent.github.repos.map((r) => ({
                  id: r.id,
                  owner: r.owner,
                  name: r.name,
                  role: r.role,
                })),
              }
            : null
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agents"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        Voltar para agentes
      </Link>

      <AgentHeader
        agent={{
          name: agent.name,
          persona: agent.persona,
          tenantName: agent.tenant.name,
          avatarUrl: agent.avatarUrl,
        }}
        status={status}
        currentTab={tab}
        basePath={basePath}
        scope="admin"
      />

      {tabContent}
    </div>
  );
}
