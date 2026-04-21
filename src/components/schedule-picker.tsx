"use client";

import { useMemo, useState } from "react";
import { humanizeSchedule } from "@/lib/schedule";

type Frequency =
  | "minutes"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "advanced";

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

function buildCron(state: {
  freq: Frequency;
  minuteInterval: number;
  dailyHour: number;
  dailyMinute: number;
  weeklyDay: number;
  weeklyHour: number;
  weeklyMinute: number;
  monthlyDay: number;
  monthlyHour: number;
  monthlyMinute: number;
  advanced: string;
}): string {
  switch (state.freq) {
    case "minutes":
      return `*/${Math.max(1, Math.min(59, state.minuteInterval))} * * * *`;
    case "hourly":
      return "0 * * * *";
    case "daily":
      return `${state.dailyMinute} ${state.dailyHour} * * *`;
    case "weekly":
      return `${state.weeklyMinute} ${state.weeklyHour} * * ${state.weeklyDay}`;
    case "monthly":
      return `${state.monthlyMinute} ${state.monthlyHour} ${state.monthlyDay} * *`;
    case "advanced":
      return state.advanced.trim() || "0 9 * * *";
  }
}

export function SchedulePicker({
  name = "schedule",
  defaultValue = "",
  error,
}: {
  name?: string;
  defaultValue?: string;
  error?: string;
}) {
  // Infere estado inicial se receber valor
  const init = useMemo(() => parseCron(defaultValue), [defaultValue]);
  const [freq, setFreq] = useState<Frequency>(init.freq);
  const [minuteInterval, setMinuteInterval] = useState(init.minuteInterval);
  const [dailyHour, setDailyHour] = useState(init.dailyHour);
  const [dailyMinute, setDailyMinute] = useState(init.dailyMinute);
  const [weeklyDay, setWeeklyDay] = useState(init.weeklyDay);
  const [weeklyHour, setWeeklyHour] = useState(init.weeklyHour);
  const [weeklyMinute, setWeeklyMinute] = useState(init.weeklyMinute);
  const [monthlyDay, setMonthlyDay] = useState(init.monthlyDay);
  const [monthlyHour, setMonthlyHour] = useState(init.monthlyHour);
  const [monthlyMinute, setMonthlyMinute] = useState(init.monthlyMinute);
  const [advanced, setAdvanced] = useState(init.advanced);

  const cron = buildCron({
    freq,
    minuteInterval,
    dailyHour,
    dailyMinute,
    weeklyDay,
    weeklyHour,
    weeklyMinute,
    monthlyDay,
    monthlyHour,
    monthlyMinute,
    advanced,
  });

  const options: { value: Frequency; label: string; hint?: string }[] = [
    { value: "minutes", label: "A cada X minutos", hint: "Para checagens rápidas" },
    { value: "hourly", label: "A cada hora" },
    { value: "daily", label: "Todo dia às..." },
    { value: "weekly", label: "Toda semana em..." },
    { value: "monthly", label: "Todo mês no dia..." },
    { value: "advanced", label: "Avançado (cron)", hint: "Só se você sabe o que é" },
  ];

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={cron} />

      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">Resumo:</p>
        <p className="mt-0.5 text-sm font-medium">{humanizeSchedule(cron)}</p>
        <code className="mt-0.5 block text-[10px] text-muted-foreground">
          {cron}
        </code>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const active = freq === opt.value;
          return (
            <label
              key={opt.value}
              className={
                "flex cursor-pointer flex-col gap-0.5 rounded-md border p-3 text-sm transition " +
                (active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-accent/50")
              }
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="_freq"
                  checked={active}
                  onChange={() => setFreq(opt.value)}
                  className="h-3.5 w-3.5"
                />
                <span className="font-medium">{opt.label}</span>
              </div>
              {opt.hint ? (
                <span className="text-[11px] text-muted-foreground pl-5">
                  {opt.hint}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      <div className="rounded-md border bg-card p-3">
        {freq === "minutes" ? (
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <span>A cada</span>
            <select
              value={minuteInterval}
              onChange={(e) => setMinuteInterval(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {[1, 5, 10, 15, 20, 30, 45].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <span>minuto(s)</span>
          </label>
        ) : null}

        {freq === "hourly" ? (
          <p className="text-sm text-muted-foreground">
            O agente vai rodar sempre aos minutos 0 de cada hora (00:00, 01:00, 02:00…).
          </p>
        ) : null}

        {freq === "daily" ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Todos os dias às</span>
            <TimePicker
              hour={dailyHour}
              minute={dailyMinute}
              onHour={setDailyHour}
              onMinute={setDailyMinute}
            />
          </div>
        ) : null}

        {freq === "weekly" ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Toda</span>
            <select
              value={weeklyDay}
              onChange={(e) => setWeeklyDay(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <span>às</span>
            <TimePicker
              hour={weeklyHour}
              minute={weeklyMinute}
              onHour={setWeeklyHour}
              onMinute={setWeeklyMinute}
            />
          </div>
        ) : null}

        {freq === "monthly" ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>No dia</span>
            <select
              value={monthlyDay}
              onChange={(e) => setMonthlyDay(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <span>do mês, às</span>
            <TimePicker
              hour={monthlyHour}
              minute={monthlyMinute}
              onHour={setMonthlyHour}
              onMinute={setMonthlyMinute}
            />
          </div>
        ) : null}

        {freq === "advanced" ? (
          <div className="space-y-1">
            <input
              value={advanced}
              onChange={(e) => setAdvanced(e.target.value)}
              placeholder="0 9 * * *"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Formato cron de 5 campos (minuto hora dia mês dia-semana).
            </p>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function TimePicker({
  hour,
  minute,
  onHour,
  onMinute,
}: {
  hour: number;
  minute: number;
  onHour: (h: number) => void;
  onMinute: (m: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-input bg-background px-1 py-0.5">
      <select
        value={hour}
        onChange={(e) => onHour(Number(e.target.value))}
        className="border-0 bg-transparent px-1 py-0.5 text-sm tabular-nums focus:outline-none"
      >
        {Array.from({ length: 24 }, (_, i) => i).map((v) => (
          <option key={v} value={v}>
            {String(v).padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className="text-sm">:</span>
      <select
        value={minute}
        onChange={(e) => onMinute(Number(e.target.value))}
        className="border-0 bg-transparent px-1 py-0.5 text-sm tabular-nums focus:outline-none"
      >
        {[0, 15, 30, 45].map((v) => (
          <option key={v} value={v}>
            {String(v).padStart(2, "0")}
          </option>
        ))}
      </select>
    </div>
  );
}

type ParsedCron = {
  freq: Frequency;
  minuteInterval: number;
  dailyHour: number;
  dailyMinute: number;
  weeklyDay: number;
  weeklyHour: number;
  weeklyMinute: number;
  monthlyDay: number;
  monthlyHour: number;
  monthlyMinute: number;
  advanced: string;
};

function parseCron(cron: string): ParsedCron {
  const def: ParsedCron = {
    freq: "daily",
    minuteInterval: 30,
    dailyHour: 9,
    dailyMinute: 0,
    weeklyDay: 1,
    weeklyHour: 8,
    weeklyMinute: 0,
    monthlyDay: 1,
    monthlyHour: 9,
    monthlyMinute: 0,
    advanced: "",
  };
  const s = cron.trim();
  if (!s) return def;

  if (s === "@hourly" || s === "0 * * * *") return { ...def, freq: "hourly" };
  if (s === "@daily" || s === "@midnight" || s === "0 0 * * *")
    return { ...def, freq: "daily", dailyHour: 0, dailyMinute: 0 };
  if (s === "@weekly" || s === "0 0 * * 0")
    return { ...def, freq: "weekly", weeklyDay: 0, weeklyHour: 0, weeklyMinute: 0 };
  if (s === "@monthly" || s === "0 0 1 * *")
    return { ...def, freq: "monthly" };

  const parts = s.split(/\s+/);
  if (parts.length !== 5) return { ...def, freq: "advanced", advanced: s };
  const [m, h, dom, , dow] = parts;

  if (m.startsWith("*/") && h === "*" && dom === "*" && dow === "*") {
    return { ...def, freq: "minutes", minuteInterval: Number(m.slice(2)) || 30 };
  }

  const numM = Number(m);
  const numH = Number(h);
  if (Number.isFinite(numM) && Number.isFinite(numH)) {
    if (dom === "*" && dow === "*") {
      return { ...def, freq: "daily", dailyHour: numH, dailyMinute: numM };
    }
    if (dom === "*" && dow !== "*" && Number.isFinite(Number(dow))) {
      return {
        ...def,
        freq: "weekly",
        weeklyDay: Number(dow),
        weeklyHour: numH,
        weeklyMinute: numM,
      };
    }
    if (dom !== "*" && dow === "*" && Number.isFinite(Number(dom))) {
      return {
        ...def,
        freq: "monthly",
        monthlyDay: Number(dom),
        monthlyHour: numH,
        monthlyMinute: numM,
      };
    }
  }

  return { ...def, freq: "advanced", advanced: s };
}
