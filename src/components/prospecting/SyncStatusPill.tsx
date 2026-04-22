import { Check, Clock, AlertCircle } from "lucide-react";

const MAP: Record<string, { label: string; css: string; Icon: any }> = {
  synced: {
    label: "Sincronizado",
    css: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
    Icon: Check,
  },
  pending: {
    label: "Pendente",
    css: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    Icon: Clock,
  },
  error: {
    label: "Erro",
    css: "bg-rose-500/15 text-rose-300 border border-rose-500/20",
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
