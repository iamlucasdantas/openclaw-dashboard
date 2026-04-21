import Link from "next/link";
import { Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { TableFilters } from "@/components/table-filters";
import { formatDate } from "@/lib/utils";
import { humanizeSchedule } from "@/lib/schedule";
import { CronsAgenda } from "@/components/crons-agenda";
import { CronsCalendar } from "@/components/crons-calendar";
import { CronViewToggle } from "@/components/cron-view-toggle";
import { DedupeCronsBanner } from "@/components/dedupe-crons-button";
import { NewCronLink } from "@/components/new-cron-link";
import { getCronView } from "@/app/actions/view-mode";

export default async function AdminCronsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; agent?: string; state?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const [rawCrons, view, allAgents] = await Promise.all([
    prisma.agentCron.findMany({
      include: { agent: { include: { tenant: true } } },
      orderBy: [{ createdAt: "desc" }],
    }),
    getCronView(),
    prisma.agent.findMany({
      orderBy: { name: "asc" },
      select: { agentId: true, name: true },
    }),
  ]);

  // Dedupe defensivo: se houver duplicatas de (agentId+name+schedule) no banco,
  // a UI mostra só o mais recente e o banner oferece limpeza.
  const seen = new Set<string>();
  let duplicates = 0;
  const crons: typeof rawCrons = [];
  for (const c of rawCrons) {
    const k = `${c.agentId}::${c.name}::${c.schedule}`;
    if (seen.has(k)) {
      duplicates++;
      continue;
    }
    seen.add(k);
    crons.push(c);
  }
  // Reordena pra apresentação estável: cliente depois nome
  crons.sort((a, b) => {
    const t = a.agent.tenant.name.localeCompare(b.agent.tenant.name);
    return t !== 0 ? t : a.name.localeCompare(b.name);
  });

  // Aplica filtros
  const filtered = crons.filter((c) => {
    if (q) {
      const hay =
        `${c.name} ${c.command} ${c.agent.name} ${c.agent.tenant.name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (sp.agent && c.agent.agentId !== sp.agent) return false;
    if (sp.state && c.state !== sp.state) return false;
    return true;
  });

  const counts = {
    active: filtered.filter((c) => c.state === "active").length,
    paused: filtered.filter((c) => c.state === "paused").length,
    disabled: filtered.filter((c) => c.state === "disabled").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas agendadas"
        description={`${counts.active} ativa(s) · ${counts.paused} pausada(s) · ${counts.disabled} desabilitada(s).`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NewCronLink agents={allAgents} scope="admin" />
            <CronViewToggle current={view} pathname="/admin/crons" />
          </div>
        }
      />

      <DedupeCronsBanner duplicates={duplicates} />

      <TableFilters
        placeholder="Buscar por tarefa, comando ou assistente..."
        filters={[
          {
            key: "agent",
            label: "Assistente",
            options: allAgents.map((a) => ({
              value: a.agentId,
              label: a.name,
            })),
          },
          {
            key: "state",
            label: "Estado",
            options: [
              { value: "active", label: "Ativa" },
              { value: "paused", label: "Pausada" },
              { value: "disabled", label: "Desabilitada" },
            ],
          },
        ]}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <tbody>
              <EmptyState
                colSpan={1}
                icon={<Clock className="h-5 w-5" />}
                title="Nenhuma tarefa agendada"
                description="As tarefas são criadas dentro da página de cada agente."
                action={{ label: "Ver agentes", href: "/admin/agents" }}
              />
            </tbody>
          </table>
        </div>
      ) : view === "calendar" ? (
        <CronsCalendar
          scopeLinks={{ agentHrefPrefix: "/admin/agents" }}
          legendMode="filter"
          crons={filtered.map((c) => ({
            id: c.id,
            name: c.name,
            schedule: c.schedule,
            state: c.state,
            agent: { agentId: c.agent.agentId, name: c.agent.name },
          }))}
        />
      ) : view === "agenda" ? (
        <CronsAgenda
          scopeLinks={{ agentHrefPrefix: "/admin/agents" }}
          crons={filtered.map((c) => ({
            id: c.id,
            name: c.name,
            schedule: c.schedule,
            state: c.state,
            agent: {
              agentId: c.agent.agentId,
              name: c.agent.name,
              tenantSlug: c.agent.tenant.slug,
              tenantName: c.agent.tenant.name,
            },
          }))}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left">Cliente</th>
                <th className="px-5 py-2.5 text-left">Agente</th>
                <th className="px-5 py-2.5 text-left">Tarefa</th>
                <th className="px-5 py-2.5 text-left">Quando</th>
                <th className="px-5 py-2.5 text-left">Estado</th>
                <th className="px-5 py-2.5 text-left">Última exec</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/tenants/${c.agent.tenant.slug}`}
                      className="hover:underline"
                    >
                      {c.agent.tenant.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium">
                    <Link
                      href={`/admin/agents/${c.agent.agentId}`}
                      className="hover:underline"
                    >
                      {c.agent.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    {c.name}
                    <div className="text-[11px] text-muted-foreground">
                      <code>{c.command}</code>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm">
                      {humanizeSchedule(c.schedule)}
                    </div>
                    <code className="text-[10px] text-muted-foreground">
                      {c.schedule}
                    </code>
                  </td>
                  <td className="px-5 py-3">
                    <StateBadge state={c.state} />
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {formatDate(c.lastRunAt)}
                    {c.lastRunStatus ? (
                      <div className="mt-0.5">status: {c.lastRunStatus}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    paused: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    disabled: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    active: "ativa",
    paused: "pausada",
    disabled: "desabilitada",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${styles[state] ?? ""}`}>
      {labels[state] ?? state}
    </span>
  );
}
