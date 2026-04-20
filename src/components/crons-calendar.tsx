"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";
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

type ScopedLinks = {
  agentHrefPrefix: "/admin/agents" | "/client/agents";
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

type RunItem = { cron: CalendarCron; time: Date };

export function CronsCalendar({
  crons,
  scopeLinks,
}: {
  crons: CalendarCron[];
  scopeLinks: ScopedLinks;
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const runsByDay = useMemo(() => {
    const map = new Map<string, RunItem[]>();
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
        const arr = map.get(k) ?? [];
        arr.push({ cron: c, time: r });
        map.set(k, arr);
      }
    }
    // ordena cronologicamente dentro de cada dia
    for (const [, arr] of map) {
      arr.sort((a, b) => a.time.getTime() - b.time.getTime());
    }
    return map;
  }, [crons, today]);

  const grid = useMemo(() => buildMonthGrid(today), [today]);

  const agentMap = useMemo(() => {
    const m = new Map<string, { name: string; agentId: string }>();
    for (const c of crons) if (c.agent) m.set(c.agent.agentId, c.agent);
    return m;
  }, [crons]);

  const [selected, setSelected] = useState<Date | null>(null);
  const selectedKey = selected?.toISOString().slice(0, 10);
  const selectedRuns = selectedKey ? (runsByDay.get(selectedKey) ?? []) : [];

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
              <button
                key={i}
                type="button"
                onClick={() => setSelected(new Date(cell.date))}
                aria-label={`${cell.date.toLocaleDateString("pt-BR")} — ${tasks.length} tarefa(s)`}
                className={
                  "group relative flex min-h-[84px] flex-col items-stretch border-b border-r p-1.5 text-left text-[11px] transition sm:min-h-[120px] sm:p-2 " +
                  "hover:bg-accent/40 focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring " +
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
                      <div
                        key={ix}
                        title={`${t.cron.name} · ${humanizeSchedule(t.cron.schedule)}`}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium"
                        style={
                          c ? { backgroundColor: c.bg, color: c.text } : undefined
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
                      </div>
                    );
                  })}
                  {tasks.length > 3 ? (
                    <div className="text-[10px] text-muted-foreground">
                      +{tasks.length - 3} mais
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <DayPanel
          date={selected}
          runs={selectedRuns}
          scopeLinks={scopeLinks}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function DayPanel({
  date,
  runs,
  scopeLinks,
  onClose,
}: {
  date: Date;
  runs: RunItem[];
  scopeLinks: ScopedLinks;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const title = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const isToday = (() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === t.getTime();
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-panel-title"
      className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative flex h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl sm:h-full sm:max-w-md sm:rounded-l-2xl sm:rounded-t-none">
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2
              id="day-panel-title"
              className="text-lg font-semibold capitalize"
            >
              {title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isToday ? "Hoje · " : ""}
              {runs.length === 0
                ? "Sem tarefas agendadas"
                : runs.length === 1
                  ? "1 tarefa programada"
                  : `${runs.length} tarefas programadas`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-m-1 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {runs.length === 0 ? (
            <div className="flex h-full items-center justify-center px-5 py-12 text-center text-sm text-muted-foreground">
              Nenhuma tarefa agendada pra este dia.
            </div>
          ) : (
            <ol className="divide-y">
              {runs.map((r, idx) => {
                const c = r.cron.agent
                  ? colorForId(r.cron.agent.agentId)
                  : null;
                const nextRun = runs[idx + 1];
                return (
                  <li
                    key={`${r.cron.id}-${r.time.toISOString()}`}
                    className="flex items-start gap-3 px-5 py-3"
                  >
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums">
                        {formatClock(r.time)}
                      </div>
                      {nextRun ? (
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          +{minutesBetween(r.time, nextRun.time)}m
                        </div>
                      ) : null}
                    </div>

                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={c ? { backgroundColor: c.dot } : undefined}
                      aria-hidden
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.cron.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {humanizeSchedule(r.cron.schedule)}
                      </p>
                      {r.cron.agent ? (
                        <Link
                          href={`${scopeLinks.agentHrefPrefix}/${r.cron.agent.agentId}`}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          style={c ? { color: c.text } : undefined}
                          onClick={onClose}
                        >
                          🤖 {r.cron.agent.name} →
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="border-t px-5 py-3 text-[11px] text-muted-foreground">
          <Clock className="mr-1 inline h-3 w-3" aria-hidden /> Horários em
          sequência cronológica.
        </div>
      </aside>
    </div>
  );
}

function minutesBetween(a: Date, b: Date) {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 60000));
}
