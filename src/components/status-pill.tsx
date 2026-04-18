import type { EffectiveStatus } from "@/lib/agent-status";

const MAP: Record<EffectiveStatus, { label: string; css: string; dot: string }> = {
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

export function StatusPill({ status }: { status: EffectiveStatus }) {
  const s = MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${s.css}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
