import Link from "next/link";
import { formatClock, humanizeSchedule, nextRunsFor } from "@/lib/schedule";

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

  // inclui dias do mês anterior (dia da semana padding) para preencher a primeira linha
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = new Date(y, m, -i);
    cells.push({ date: d, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(y, m, d), inMonth: true });
  }
  // completa 6 linhas (42 células)
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

  // calcula todas as próximas execuções dos crons ativos nos próximos ~35 dias
  const runsByDay = new Map<
    string,
    { cron: CalendarCron; time: Date }[]
  >();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 35);

  for (const c of crons) {
    if (c.state !== "active") continue;
    // gera uma janela maior de execuções (até 60) dependendo da frequência
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {crons.filter((c) => c.state === "active").length} tarefa(s) ativa(s)
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {WEEK_LABELS.map((l) => (
            <div key={l} className="p-2 text-center">
              {l}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((cell, i) => {
            const k = cell.date.toISOString().slice(0, 10);
            const tasks = runsByDay.get(k) ?? [];
            const isToday = cell.date.getTime() === today.getTime();
            const isFaded = !cell.inMonth;
            return (
              <div
                key={i}
                className={
                  "min-h-[70px] border-b border-r p-1.5 text-[11px] sm:min-h-[96px] sm:p-2 " +
                  (isFaded ? "bg-muted/20 text-muted-foreground/60 " : "") +
                  (isToday ? "bg-primary/5 ring-1 ring-inset ring-primary " : "")
                }
              >
                <div
                  className={
                    "mb-1 flex items-center justify-between " +
                    (isToday ? "font-semibold text-primary" : "")
                  }
                >
                  <span>{cell.date.getDate()}</span>
                  {tasks.length > 0 ? (
                    <span className="rounded-full bg-primary/20 px-1.5 text-[10px] font-medium text-primary">
                      {tasks.length}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-0.5">
                  {tasks.slice(0, 3).map((t, ix) => (
                    <Link
                      key={ix}
                      href={
                        t.cron.agent
                          ? `${scopeLinks.agentHrefPrefix}/${t.cron.agent.agentId}`
                          : "#"
                      }
                      title={`${t.cron.name} · ${humanizeSchedule(t.cron.schedule)}`}
                      className="block truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary hover:bg-primary/20"
                    >
                      {formatClock(t.time)} {t.cron.name}
                    </Link>
                  ))}
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
