import Link from "next/link";
import { Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";
import { humanizeSchedule } from "@/lib/schedule";
import { CronsAgenda } from "@/components/crons-agenda";
import { CronsCalendar } from "@/components/crons-calendar";
import { CronViewToggle } from "@/components/cron-view-toggle";
import { getCronView } from "@/app/actions/view-mode";

export default async function ClientCronsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantIds = session.user.tenantIds ?? [];
  const [crons, view] = await Promise.all([
    prisma.agentCron.findMany({
      where: { agent: { tenantId: { in: tenantIds } } },
      include: { agent: { include: { tenant: true } } },
      orderBy: [{ agent: { name: "asc" } }, { name: "asc" }],
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
        actions={<CronViewToggle current={view} pathname="/client/crons" />}
      />

      {crons.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title="Nenhuma tarefa agendada"
          description="Crie tarefas dentro da página de cada agente."
          action={{ label: "Ver meus agentes", href: "/client/agents" }}
        />
      ) : view === "calendar" ? (
        <CronsCalendar
          scopeLinks={{ agentHrefPrefix: "/client/agents" }}
          legendMode="filter"
          crons={crons.map((c) => ({
            id: c.id,
            name: c.name,
            schedule: c.schedule,
            state: c.state,
            agent: { agentId: c.agent.agentId, name: c.agent.name },
          }))}
        />
      ) : view === "agenda" ? (
        <CronsAgenda
          scopeLinks={{ agentHrefPrefix: "/client/agents" }}
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
                  <td className="px-5 py-3 font-medium">
                    <Link
                      href={`/client/agents/${c.agent.agentId}`}
                      className="hover:underline"
                    >
                      {c.agent.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    {c.name}
                    <div className="text-[11px] text-muted-foreground">
                      {c.command}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm">{humanizeSchedule(c.schedule)}</div>
                  </td>
                  <td className="px-5 py-3 text-xs">{c.state}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {formatDate(c.lastRunAt)}
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
