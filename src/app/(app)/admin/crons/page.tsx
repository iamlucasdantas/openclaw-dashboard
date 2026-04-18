import Link from "next/link";
import { Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";
import { humanizeSchedule } from "@/lib/schedule";
import { CronsAgenda } from "@/components/crons-agenda";
import { CronViewToggle } from "@/components/cron-view-toggle";
import { getCronView } from "@/app/actions/view-mode";

export default async function AdminCronsPage() {
  const [crons, view] = await Promise.all([
    prisma.agentCron.findMany({
      include: { agent: { include: { tenant: true } } },
      orderBy: [{ agent: { tenant: { name: "asc" } } }, { name: "asc" }],
    }),
    getCronView(),
  ]);

  const counts = {
    active: crons.filter((c) => c.state === "active").length,
    paused: crons.filter((c) => c.state === "paused").length,
    disabled: crons.filter((c) => c.state === "disabled").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas agendadas"
        description={`${counts.active} ativa(s) · ${counts.paused} pausada(s) · ${counts.disabled} desabilitada(s).`}
        actions={
          <CronViewToggle current={view} pathname="/admin/crons" />
        }
      />

      {crons.length === 0 ? (
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
      ) : view === "agenda" ? (
        <CronsAgenda
          scopeLinks={{ agentHrefPrefix: "/admin/agents" }}
          crons={crons.map((c) => ({
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
              {crons.map((c) => (
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
