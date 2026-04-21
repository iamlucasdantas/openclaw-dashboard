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
    ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"
    : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100";

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
