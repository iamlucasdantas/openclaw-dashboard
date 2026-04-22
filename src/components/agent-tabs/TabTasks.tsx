"use client";

import { useState } from "react";
import { TaskItem, type TaskForDisplay } from "@/components/task-item";
import { CalendarDays, List, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Range = "today" | "24h" | "7d" | "30d" | "60d" | "all";

type Props = {
  range: Range;
  basePath: string;
  tasks: TaskForDisplay[];
  agentHrefPrefix: "/admin/agents" | "/client/agents";
  initialView?: "list" | "calendar";
};

const LABELS: Record<Range, string> = {
  today: "Hoje",
  "24h": "24h",
  "7d": "7 dias",
  "30d": "30 dias",
  "60d": "60 dias",
  all: "Todos",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-500",
  in_progress: "bg-amber-500",
  started: "bg-blue-500",
  failed: "bg-red-500",
};

const STATUS_DOTS: Record<string, string> = {
  completed: "border-emerald-400 bg-emerald-500/30",
  in_progress: "border-amber-400 bg-amber-500/30",
  started: "border-blue-400 bg-blue-500/30",
  failed: "border-red-400 bg-red-500/30",
};

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();
  const rows: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= totalDays; d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      rows.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    rows.push(week);
  }
  return rows;
}

function groupTasksByDate(tasks: TaskForDisplay[]) {
  const map = new Map<string, TaskForDisplay[]>();
  for (const t of tasks) {
    const d = new Date(t.startedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function TabTasks({ range, basePath, tasks, agentHrefPrefix, initialView }: Props) {
  const [view, setView] = useState<"list" | "calendar">(initialView || "list");
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const filters: Range[] = ["today", "24h", "7d", "30d", "60d", "all"];

  const tasksByDate = groupTasksByDate(tasks);
  const calDays = getCalendarDays(calMonth.year, calMonth.month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Período</span>
          <div className="inline-flex items-center rounded-lg border border-border bg-secondary p-0.5">
            {filters.map((r) => {
              const active = r === range;
              const href = r === "today" ? `${basePath}&view=${view}` : `${basePath}&range=${r}&view=${view}`;
              return (
                <Link
                  key={r}
                  href={href}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {LABELS[r]}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
          </p>
          <div className="inline-flex items-center rounded-lg border border-border bg-secondary p-0.5">
            <button
              onClick={() => setView("list")}
              className={cn(
                "rounded px-2 py-1 text-xs transition",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
              title="Visão em lista"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "rounded px-2 py-1 text-xs transition",
                view === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
              title="Visão em calendário"
            >
              <CalendarDays className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="rounded-xl border border-border bg-card p-4">
          {/* Calendar header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => {
                const d = new Date(calMonth.year, calMonth.month - 1, 1);
                setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold text-foreground">
              {MONTHS_PT[calMonth.month]} {calMonth.year}
            </h3>
            <button
              onClick={() => {
                const d = new Date(calMonth.year, calMonth.month + 1, 1);
                setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS_PT.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {calDays.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="min-h-[72px]" />;
                  const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                  const dayTasks = tasksByDate.get(dateStr) || [];
                  const isToday = dateStr === todayStr;
                  const isCurrentMonth = day.getMonth() === calMonth.month;

                  return (
                    <div
                      key={di}
                      className={cn(
                        "min-h-[72px] rounded-lg border border-border/50 p-1.5 transition-colors",
                        isToday && "border-primary/50 bg-primary/5",
                        !isCurrentMonth && "opacity-40",
                        dayTasks.length > 0 && "bg-card"
                      )}
                    >
                      <div className={cn(
                        "mb-1 text-[11px] font-medium",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            className={cn(
                              "truncate rounded px-1 py-0.5 text-[9px] leading-tight",
                              STATUS_DOTS[t.status] || "bg-gray-500/20"
                            )}
                            title={t.title}
                          >
                            {t.title.length > 20 ? t.title.slice(0, 18) + "…" : t.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-[9px] text-muted-foreground pl-1">
                            +{dayTasks.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> 
              <span className="text-[10px] text-muted-foreground">Concluída</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-muted-foreground">Em andamento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-muted-foreground">Iniciada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-muted-foreground">Falhou</span>
            </div>
          </div>
        </div>
      ) : (
        <section>
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhuma tarefa neste período.
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} agentHrefPrefix={agentHrefPrefix} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
