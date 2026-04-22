import { AlertTriangle } from "lucide-react";
import { formatUsd } from "@/lib/costs";

export function BudgetBar({
  used,
  budget,
  label,
}: {
  used: number;
  budget: number | null | undefined;
  label?: string;
}) {
  if (!budget || budget <= 0) {
    return (
      <div className="text-xs text-muted-foreground">
        Sem limite de custo definido.
      </div>
    );
  }
  const pct = Math.min(100, (used / budget) * 100);
  const over = used > budget;
  const near = !over && pct >= 80;

  const color = over
    ? "bg-destructive"
    : near
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label ?? "Uso mensal"}</span>
        <span className="tabular-nums">
          {formatUsd(used)} / {formatUsd(budget)} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      {over ? (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" /> Limite excedido em{" "}
          {formatUsd(used - budget)}.
        </div>
      ) : near ? (
        <div className="flex items-center gap-1 text-xs text-amber-300">
          <AlertTriangle className="h-3 w-3" /> Atenção: {pct.toFixed(0)}% do
          limite usado.
        </div>
      ) : null}
    </div>
  );
}
