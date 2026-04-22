import cronstrue from "cronstrue/i18n";

const SHORTHAND: Record<string, string> = {
  "@hourly": "0 * * * *",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@weekly": "0 0 * * 0",
  "@monthly": "0 0 1 * *",
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
};

function parseEverySchedule(schedule: string) {
  const m = schedule.trim().match(/^every\s+(\d+)\s*([mhd])$/i);
  if (!m) return null;
  const amount = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const ms = unit === "m" ? amount * 60_000 : unit === "h" ? amount * 3_600_000 : amount * 86_400_000;
  return { amount, unit, ms };
}

function parseAtSchedule(schedule: string) {
  const trimmed = schedule.trim();
  if (!trimmed.includes("T")) return null;
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

// Converte cron expression, every Xm ou data única em texto natural em PT-BR.
export function humanizeSchedule(schedule: string): string {
  const trimmed = schedule.trim();
  const every = parseEverySchedule(trimmed);
  if (every) {
    const unitLabel =
      every.unit === "m"
        ? every.amount === 1
          ? "minuto"
          : "minutos"
        : every.unit === "h"
          ? every.amount === 1
            ? "hora"
            : "horas"
          : every.amount === 1
            ? "dia"
            : "dias";
    return `A cada ${every.amount} ${unitLabel}`;
  }

  const at = parseAtSchedule(trimmed);
  if (at) {
    return at.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const expr = SHORTHAND[trimmed] ?? trimmed;

  try {
    return cronstrue.toString(expr, {
      locale: "pt_BR",
      use24HourTimeFormat: true,
      verbose: false,
    });
  } catch {
    return schedule;
  }
}

type CronField = { kind: "any" } | { kind: "step"; step: number } | { kind: "list"; values: number[] };

function parseField(raw: string, min: number, max: number): CronField {
  if (raw === "*") return { kind: "any" };
  if (raw.startsWith("*/")) {
    const step = Number(raw.slice(2));
    if (Number.isFinite(step) && step > 0) return { kind: "step", step };
  }
  const parts = raw.split(",");
  const values: number[] = [];
  for (const p of parts) {
    if (p.includes("-")) {
      const [a, b] = p.split("-").map(Number);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        for (let v = a; v <= b; v++) values.push(v);
      }
    } else {
      const n = Number(p);
      if (Number.isFinite(n)) values.push(n);
    }
  }
  if (values.length === 0) return { kind: "any" };
  return { kind: "list", values: values.filter((v) => v >= min && v <= max) };
}

function matches(field: CronField, value: number): boolean {
  if (field.kind === "any") return true;
  if (field.kind === "step") return value % field.step === 0;
  return field.values.includes(value);
}

// Calcula as próximas execuções. Suporta cron, shorthands, every Xm/Xh/Xd e datas únicas ISO.
export function nextRunsFor(
  schedule: string,
  count: number,
  from = new Date(),
  seedNextRun?: Date | null
): Date[] {
  const trimmed = schedule.trim();

  const every = parseEverySchedule(trimmed);
  if (every) {
    const out: Date[] = [];
    let cursor = seedNextRun ? new Date(seedNextRun) : new Date(from.getTime() + every.ms);
    while (cursor.getTime() <= from.getTime()) {
      cursor = new Date(cursor.getTime() + every.ms);
    }
    while (out.length < count) {
      out.push(new Date(cursor));
      cursor = new Date(cursor.getTime() + every.ms);
    }
    return out;
  }

  const at = parseAtSchedule(trimmed);
  if (at) {
    return at.getTime() > from.getTime() ? [at] : [];
  }

  const expr = SHORTHAND[trimmed] ?? trimmed;
  const parts = expr.split(/\s+/);
  if (parts.length !== 5) return [];

  const [mRaw, hRaw, domRaw, monRaw, dowRaw] = parts;
  const m = parseField(mRaw, 0, 59);
  const h = parseField(hRaw, 0, 23);
  const dom = parseField(domRaw, 1, 31);
  const mon = parseField(monRaw, 1, 12);
  const dow = parseField(dowRaw, 0, 6);

  const out: Date[] = [];
  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  // Máximo 14 dias à frente
  const deadline = new Date(from);
  deadline.setDate(deadline.getDate() + 14);

  let iterations = 0;
  const MAX_ITER = 20160; // 14 dias * 24h * 60min

  while (out.length < count && cursor < deadline && iterations < MAX_ITER) {
    iterations++;
    if (
      matches(m, cursor.getMinutes()) &&
      matches(h, cursor.getHours()) &&
      matches(dom, cursor.getDate()) &&
      matches(mon, cursor.getMonth() + 1) &&
      matches(dow, cursor.getDay())
    ) {
      out.push(new Date(cursor));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return out;
}

export function formatClock(d: Date) {
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDayLabel(d: Date, today = new Date()) {
  const tDay = new Date(today);
  tDay.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diffDays = Math.round((x.getTime() - tDay.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  const week = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  if (diffDays > 1 && diffDays < 7) return week[d.getDay()];
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
