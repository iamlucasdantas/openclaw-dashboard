import { copy } from "@/lib/copy";
import { humanStatusKey, type EffectiveStatus } from "@/lib/agent-status";

type PillStyle = { css: string; dot: string };

// Camada admin: rótulos técnicos curtos (diagnóstico rápido).
const ADMIN_MAP: Record<EffectiveStatus, { label: string } & PillStyle> = {
  online: {
    label: "online",
    css: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  stale: {
    label: "sem heartbeat",
    css: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    dot: "bg-amber-400",
  },
  degraded: {
    label: "degradado",
    css: "bg-orange-500/15 text-orange-300 border border-orange-500/20",
    dot: "bg-orange-400",
  },
  offline: {
    label: "offline",
    css: "bg-muted/60 text-muted-foreground border border-border",
    dot: "bg-muted-foreground/60",
  },
};

// Camada cliente: estados semânticos (copy.status.*).
const CLIENT_STYLE: Record<ReturnType<typeof humanStatusKey>, PillStyle> = {
  working: {
    css: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  quiet: {
    css: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    dot: "bg-amber-400",
  },
  attention: {
    css: "bg-orange-500/15 text-orange-300 border border-orange-500/20",
    dot: "bg-orange-400",
  },
  stopped: {
    css: "bg-rose-500/15 text-rose-300 border border-rose-500/20",
    dot: "bg-rose-400",
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
