import { copy } from "@/lib/copy";
import { humanStatusKey, type EffectiveStatus } from "@/lib/agent-status";

type PillStyle = { css: string; dot: string };

// Camada admin: rótulos técnicos curtos (diagnóstico rápido).
const ADMIN_MAP: Record<EffectiveStatus, { label: string } & PillStyle> = {
  online: {
    label: "online",
    css: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  stale: {
    label: "sem heartbeat",
    css: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  degraded: {
    label: "degradado",
    css: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  offline: {
    label: "offline",
    css: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
};

// Camada cliente: estados semânticos (copy.status.*).
const CLIENT_STYLE: Record<ReturnType<typeof humanStatusKey>, PillStyle> = {
  working: {
    css: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  quiet: {
    css: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  attention: {
    css: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  stopped: {
    css: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export function StatusPill({
  status,
  scope = "admin",
  showHint = false,
}: {
  status: EffectiveStatus;
  scope?: "admin" | "client";
  showHint?: boolean;
}) {
  if (scope === "client") {
    const key = humanStatusKey(status);
    const style = CLIENT_STYLE[key];
    const { label, hint } = copy.status[key];
    return (
      <span
        title={hint}
        aria-label={`${label} — ${hint}`}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.css}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {label}
        {showHint ? (
          <span className="ml-1 hidden text-[10px] opacity-70 sm:inline">
            · {hint}
          </span>
        ) : null}
      </span>
    );
  }

  // admin
  const s = ADMIN_MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${s.css}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
