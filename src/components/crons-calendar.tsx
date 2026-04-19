import Link from "next/link";
import { colorForId } from "@/lib/palette";
import {
  formatClock,
  humanizeSchedule,
  nextRunsFor,
} from "@/lib/schedule";

export type CalendarCron = {
  id: string;
  name: string;
  schedule: string;
  state: string;
  agent?: {
    agentId: string;
    name: string;
  };
};

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function buildMonthGrid(reference: Date) {
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const first = new Date(y, m, 1);
  const firstDow = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = new Date(y, m, -i);
    cells.push({ date: d, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(y, m, d), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, inMonth: next.getMonth() === m });
  }
  return cells;
}

export function CronsCalendar({
  crons,
  scopeLinks,
}: {
  crons: CalendarCron[];
  scopeLinks: { agentHrefPrefix: "/admin/agents" | "/client/agents" };
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const runsByDay = new Map<
    string,
    { cron: CalendarCron; time: Date }[]
  >();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 35);

  for (const c of crons) {
    if (c.state !== "active") continue;
    const runs = nextRunsFor(c.schedule, 60, today);
    for (const r of runs) {
      if (r > horizon) break;
      const key = new Date(r);
      key.setHours(0, 0, 0, 0);
      const k = key.toISOString().slice(0, 10);
      const arr = runsByDay.get(k) ?? [];
      arr.push({ cron: c, time: r });
      runsByDay.set(k, arr);
    }
  }

  const grid = buildMonthGrid(today);

  // Agentes únicos pra legenda
  const agentMap = new Map<string, { name: string; agentId: string }>();
  for (const c of crons) {
    if (c.agent) agentMap.set(c.agent.agentId, c.agent);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="text-lg font-semibold tracking-tight">
          {MONTH_NAMES[today.getMonth()]}{" "}
          <span className="text-muted-foreground">{today.getFullYear()}</span>
        </h3>
        <span className="text-xs text-muted-foreground">
          {crons.filter((c) => c.state === "active").length} tarefa(s) ativa(s)
        </span>
      </div>

      {/* Legenda de cores por assistente */}
      {agentMap.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {Array.from(agentMap.values()).map((a) => {
            const c = colorForId(a.agentId);
            return (
              <Link
                key={a.agentId}
                href={`${scopeLinks.agentHrefPrefix}/${a.agentId}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.dot }}
                  aria-hidden
                />
                {a.name}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {WEEK_LABELS.map((l, i) => (
            <div
              key={l}
              className={
                "p-2 text-center " +
                (i === 0 || i === 6 ? "text-muted-foreground/70" : "")
              }
            >
              {l}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((cell, i) => {
            const k = cell.date.toISOString().slice(0, 10);
            const tasks = runsByDay.get(k) ?? [];
            const isToday = cell.date.getTime() === today.getTime();
            const isWeekend =
              cell.date.getDay() === 0 || cell.date.getDay() === 6;
            const isFaded = !cell.inMonth;

            return (
              <div
                key={i}
                className={
                  "min-h-[84px] border-b border-r p-1.5 text-[11px] sm:min-h-[120px] sm:p-2 " +
                  (isFaded
                    ? "bg-muted/20 text-muted-foreground/60 "
                    : isWeekend
                      ? "bg-muted/10 "
                      : "") +
                  (isToday
                    ? "bg-primary/5 ring-1 ring-inset ring-primary "
                    : "")
                }
              >
                <div
                  className={
                    "mb-1 flex items-center justify-between " +
                    (isToday
                      ? "font-semibold text-primary"
                      : isFaded
                        ? ""
                        : "text-foreground/80")
                  }
                >
                  <span className={isToday ? "text-sm" : ""}>
                    {cell.date.getDate()}
                  </span>
                  {tasks.length > 0 ? (
                    <span className="rounded-full bg-primary/20 px-1.5 text-[10px] font-medium text-primary">
                      {tasks.length}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-0.5">
                  {tasks.slice(0, 3).map((t, ix) => {
                    const c = t.cron.agent
                      ? colorForId(t.cron.agent.agentId)
                      : null;
                    return (
                      <Link
                        key={ix}
                        href={
                          t.cron.agent
                            ? `${scopeLinks.agentHrefPrefix}/${t.cron.agent.agentId}`
                            : "#"
                        }
                        title={`${t.cron.name} · ${humanizeSchedule(t.cron.schedule)}`}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium transition hover:opacity-80"
                        style={
                          c
                            ? {
                                backgroundColor: c.bg,
                                color: c.text,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={c ? { backgroundColor: c.dot } : undefined}
                          aria-hidden
                        />
                        <span className="truncate">
                          {formatClock(t.time)} {t.cron.name}
                        </span>
                      </Link>
                    );
                  })}
                  {tasks.length > 3 ? (
                    <div className="text-[10px] text-muted-foreground">
                      +{tasks.length - 3} mais
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
