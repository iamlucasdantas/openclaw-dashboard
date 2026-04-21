import { Check, Clock, AlertCircle } from "lucide-react";

const MAP: Record<string, { label: string; css: string; Icon: any }> = {
  synced: {
    label: "Sincronizado",
    css: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    Icon: Check,
  },
  pending: {
    label: "Pendente",
    css: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    Icon: Clock,
  },
  error: {
    label: "Erro",
    css: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    Icon: AlertCircle,
  },
};

export function SyncStatusPill({ status }: { status: string }) {
  const s = MAP[status] ?? MAP.pending;
  const { Icon } = s;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.css}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {s.label}
    </span>
  );
}
