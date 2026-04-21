import Link from "next/link";
import { Clock } from "lucide-react";
import { formatClock, formatDayLabel, humanizeSchedule, nextRunsFor } from "@/lib/schedule";

export type AgendaCron = {
  id: string;
  name: string;
  schedule: string;
  state: string;
  agent?: {
    agentId: string;
    name: string;
    tenantSlug?: string;
    tenantName?: string;
  };
};

type ScopedLinks = { agentHrefPrefix: "/admin/agents" | "/client/agents" };

function groupByDay(
  crons: AgendaCron[]
): { day: Date; items: { cron: AgendaCron; runs: Date[] }[] }[] {
  // próximas 15 execuções cobrem bem os próximos 7 dias
  const buckets = new Map<string, { day: Date; items: { cron: AgendaCron; runs: Date[] }[] }>();
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    d.setHours(0, 0, 0, 0);
    buckets.set(d.toDateString(), { day: d, items: [] });
  }

  for (const c of crons) {
    if (c.state !== "active") continue;
    const runs = nextRunsFor(c.schedule, 20, today);
    const byDay = new Map<string, Date[]>();
    for (const r of runs) {
      const key = new Date(r);
      key.setHours(0, 0, 0, 0);
      const k = key.toDateString();
      const arr = byDay.get(k) ?? [];
      arr.push(r);
      byDay.set(k, arr);
    }
    for (const [k, dates] of byDay.entries()) {
      const bucket = buckets.get(k);
      if (bucket) bucket.items.push({ cron: c, runs: dates.slice(0, 6) });
    }
  }

  return Array.from(buckets.values());
}

export function CronsAgenda({
  crons,
  scopeLinks,
}: {
  crons: AgendaCron[];
  scopeLinks: ScopedLinks;
}) {
  const days = groupByDay(crons);
  const hasAny = days.some((d) => d.items.length > 0);

  if (!hasAny) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhuma tarefa agendada ativa nos próximos 7 dias.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {days.map(({ day, items }) => (
        <section
          key={day.toISOString()}
          className="rounded-lg border bg-card"
        >
          <div className="flex items-center justify-between border-b px-5 py-2.5">
            <h3 className="text-sm font-semibold">{formatDayLabel(day)}</h3>
            <span className="text-[11px] text-muted-foreground">
              {day.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
              })}{" "}
              · {items.length} tarefa(s)
            </span>
          </div>
          {items.length === 0 ? (
            <div className="px-5 py-4 text-xs text-muted-foreground">
              Sem tarefas agendadas.
            </div>
          ) : (
            <ul className="divide-y">
              {items
                .sort(
                  (a, b) => a.runs[0].getTime() - b.runs[0].getTime()
                )
                .map(({ cron, runs }) => (
                  <li
                    key={cron.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{cron.name}</span>
                        {cron.agent ? (
                          <Link
                            href={`${scopeLinks.agentHrefPrefix}/${cron.agent.agentId}`}
                            className="text-[11px] text-muted-foreground hover:underline"
                          >
                            em {cron.agent.name}
                          </Link>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {humanizeSchedule(cron.schedule)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {runs.map((r, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] tabular-nums"
                        >
                          <Clock className="h-3 w-3" />
                          {formatClock(r)}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
