import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { copy, t } from "@/lib/copy";

export function CostAlert({
  pctOfBudget,
  budgetUsd,
}: {
  pctOfBudget: number | null;
  budgetUsd: number | null;
}) {
  // Sem limite → não renderiza alerta (menos ruído).
  if (budgetUsd == null || pctOfBudget == null) return null;

  const critical = pctOfBudget >= 100;
  const warn = pctOfBudget >= 70 && !critical;

  if (!critical && !warn) return null; // só alerta quando relevante

  const tone = critical
    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
    : "border-amber-500/30 bg-amber-500/10 text-amber-200";

  const Icon = critical ? AlertTriangle : AlertTriangle;
  const line = critical
    ? copy.costs.alerts.critical
    : t(copy.costs.alerts.warn, { pct: pctOfBudget });

  return (
    <div role="alert" className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="text-sm font-medium">{line}</p>
      </div>
    </div>
  );
}
