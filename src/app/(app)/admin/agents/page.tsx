import Link from "next/link";
import { Activity, Bot, Plus, Radio, Sparkles, Workflow } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { TableFilters } from "@/components/table-filters";
import { effectiveStatus } from "@/lib/agent-status";
import { AgentCardGrid } from "@/components/agent-card-grid";
import { CardGlowTracker } from "@/components/card-glow-tracker";

function StatCard({ icon, label, value, help }: { icon: React.ReactNode; label: string; value: string | number; help: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">{icon}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-300">{help}</div>
    </div>
  );
}

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tenant?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const [allAgents, tenants] = await Promise.all([
    prisma.agent.findMany({
      include: {
        tenant: true,
        _count: { select: { skills: true, crons: true } },
      },
      orderBy: [{ lastHeartbeatAt: "desc" }, { tenant: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  const agents = allAgents.filter((a) => {
    if (q) {
      const hay = `${a.name} ${a.agentId} ${a.model ?? ""} ${a.tenant.name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (sp.tenant && a.tenant.slug !== sp.tenant) return false;
    if (sp.status) {
      const eff = effectiveStatus(a);
      if (eff !== sp.status) return false;
    }
    return true;
  });

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
    href: `/admin/agents/${a.agentId}`,
    tenantHref: `/admin/tenants/${a.tenant.slug}`,
    scope: "admin" as const,
  }));

  const liveAgents = cardData.filter((a) => a.status === "online" || a.status === "stale" || a.status === "degraded");
  const backgroundAgents = cardData.filter((a) => !liveAgents.some((live) => live.id === a.id));
  const totalSkills = cardData.reduce((sum, agent) => sum + agent.skillsCount, 0);
  const totalCrons = cardData.reduce((sum, agent) => sum + agent.cronsCount, 0);
  const filtered = Boolean(q || sp.tenant || sp.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agentes"
        description="Controle visual da operação. Veja quem está vivo, quem está em risco e quem precisa de atenção."
        actions={
          <Link href="/admin/agents/new">
            <Button>
              <Plus className="h-4 w-4" />
              Novo agente
            </Button>
          </Link>
        }
      />

      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#050b16] p-6 text-white shadow-[0_30px_100px_rgba(2,6,23,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.20),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.20),transparent_34%)]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Agent Operations Center
          </div>
          <div className="mt-4 max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight">Uma visão muito mais guiada, visual e operacional.</h2>
            <p className="mt-2 text-base text-slate-300">
              Priorizamos os agentes vivos no topo, deixamos os sinais mais visuais e transformamos cada card em porta de entrada do cockpit.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Bot className="h-5 w-5" />} label="agentes" value={cardData.length} help="Base total carregada no painel" />
            <StatCard icon={<Radio className="h-5 w-5" />} label="ao vivo" value={liveAgents.length} help="Online, stale ou degradado" />
            <StatCard icon={<Workflow className="h-5 w-5" />} label="crons" value={totalCrons} help="Automações conectadas" />
            <StatCard icon={<Activity className="h-5 w-5" />} label="skills" value={totalSkills} help="Capacidades instaladas" />
          </div>
        </div>
      </section>

      <TableFilters
        placeholder="Buscar por nome, agentId, cliente, modelo..."
        filters={[
          {
            key: "tenant",
            label: "Cliente",
            options: tenants.map((t) => ({ value: t.slug, label: t.name })),
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "online", label: "online" },
              { value: "stale", label: "sem heartbeat" },
              { value: "degraded", label: "degradado" },
              { value: "offline", label: "offline" },
            ],
          },
        ]}
      />

      {cardData.length > 0 ? (
        <CardGlowTracker>
          {filtered ? (
            <section className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">Resultado filtrado</h3>
                <p className="text-sm text-muted-foreground">Mostrando apenas o recorte escolhido.</p>
              </div>
              <AgentCardGrid agents={cardData} />
            </section>
          ) : (
            <div className="space-y-8">
              <section className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Operação ao vivo</h3>
                  <p className="text-sm text-muted-foreground">Agentes com sinal recente, priorizados para acompanhamento imediato.</p>
                </div>
                <AgentCardGrid agents={liveAgents.length > 0 ? liveAgents : cardData.slice(0, 6)} />
              </section>

              {backgroundAgents.length > 0 ? (
                <section className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Base completa</h3>
                    <p className="text-sm text-muted-foreground">Catálogo total, incluindo agentes frios ou sem atividade recente.</p>
                  </div>
                  <AgentCardGrid agents={backgroundAgents} />
                </section>
              ) : null}
            </div>
          )}
        </CardGlowTracker>
      ) : allAgents.length > 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/50 px-5 py-16 text-center text-sm text-muted-foreground">
          Nenhum agente bate com esses filtros.
        </div>
      ) : (
        <EmptyState
          icon={<Bot className="h-5 w-5" />}
          title="Nenhum agente cadastrado"
          description="Registre o primeiro agente e vincule a um cliente."
          action={{ label: "Novo agente", href: "/admin/agents/new" }}
        />
      )}
    </div>
  );
}
