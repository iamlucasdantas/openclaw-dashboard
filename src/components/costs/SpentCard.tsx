import { copy } from "@/lib/copy";
import { formatBRL } from "@/lib/currency";

export function SpentCard({
  spentUsd,
  budgetUsd,
}: {
  spentUsd: number;
  budgetUsd: number | null;
}) {
  const pct =
    budgetUsd && budgetUsd > 0
      ? Math.min(100, Math.round((spentUsd / budgetUsd) * 100))
      : null;

  const barColor =
    pct == null
      ? "bg-emerald-500"
      : pct >= 100
        ? "bg-rose-500"
        : pct >= 70
          ? "bg-amber-500"
          : "bg-emerald-500";

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {copy.costs.cards.spent}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">
        {formatBRL(spentUsd)}
      </p>

      {budgetUsd ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            de {formatBRL(budgetUsd)}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${barColor}`}
              style={{ width: `${pct ?? 0}%` }}
              aria-label={`${pct}% do limite usado`}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
            {pct}%
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          {copy.costs.cards.noLimit}
        </p>
      )}
    </div>
  );
}
