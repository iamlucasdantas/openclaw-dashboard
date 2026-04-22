import Link from "next/link";
import { Bot, Plus, Radio, Sparkles, Workflow } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { effectiveStatus } from "@/lib/agent-status";
import { AgentCardGrid } from "@/components/agent-card-grid";
import { CardGlowTracker } from "@/components/card-glow-tracker";

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white backdrop-blur-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">{icon}</div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
        <div className="text-lg font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

export default async function ClientAgentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantIds = session.user.tenantIds ?? [];

  const agents = await prisma.agent.findMany({
    where: { tenantId: { in: tenantIds } },
    include: {
      tenant: true,
      _count: { select: { skills: true, crons: true } },
    },
    orderBy: [{ lastHeartbeatAt: "desc" }, { tenant: { name: "asc" } }, { name: "asc" }],
  });

  const canCreate = tenantIds.length > 0;

  const cardData = agents.map((a) => ({
    id: a.id,
    name: a.name,
    agentId: a.agentId,
    model: a.model,
    tenantName: a.tenant.name,
    tenantSlug: a.tenant.slug,
    status: effectiveStatus(a),
    skillsCount: a._count.skills,
    cronsCount: a._count.crons,
    lastHeartbeatAt: a.lastHeartbeatAt,
    href: `/client/agents/${a.agentId}`,
    tenantHref: `/admin/tenants/${a.tenant.slug}`,
    scope: "client" as const,
  }));

  const liveAgents = cardData.filter((a) => a.status === "online" || a.status === "stale" || a.status === "degraded");
  const totalCrons = cardData.reduce((sum, agent) => sum + agent.cronsCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus agentes"
        description="Uma visão mais clara dos agentes vinculados aos seus tenants."
        actions={
          canCreate ? (
            <Link href="/client/agents/new">
              <Button>
                <Plus className="h-4 w-4" />
                Novo agente
              </Button>
            </Link>
          ) : null
        }
      />

      {cardData.length > 0 ? (
        <>
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#050b16] p-6 text-white shadow-[0_30px_100px_rgba(2,6,23,0.55)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_34%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Visual cockpit
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Mais leitura visual, menos tela plana.</h2>
              <p className="mt-2 max-w-2xl text-base text-slate-300">
                Seus agentes agora aparecem com destaque de status, identidade visual e acesso direto ao cockpit operacional.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <StatPill icon={<Bot className="h-5 w-5" />} label="agentes" value={cardData.length} />
                <StatPill icon={<Radio className="h-5 w-5" />} label="ativos" value={liveAgents.length} />
                <StatPill icon={<Workflow className="h-5 w-5" />} label="crons" value={totalCrons} />
              </div>
            </div>
          </section>

          <CardGlowTracker>
            <AgentCardGrid agents={cardData} />
          </CardGlowTracker>
        </>
      ) : (
        <EmptyState
          icon={<Bot className="h-5 w-5" />}
          title="Você ainda não tem agentes"
          description={
            canCreate
              ? "Crie seu primeiro agente em um dos seus clientes."
              : "Peça ao admin para vincular você a um cliente."
          }
          action={
            canCreate
              ? { label: "Novo agente", href: "/client/agents/new" }
              : undefined
          }
        />
      )}
    </div>
  );
}
