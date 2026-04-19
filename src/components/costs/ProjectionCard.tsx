import { TrendingUp } from "lucide-react";
import { copy } from "@/lib/copy";
import { formatBRL } from "@/lib/currency";

export function ProjectionCard({
  projectionUsd,
  budgetUsd,
}: {
  projectionUsd: number;
  budgetUsd: number | null;
}) {
  const willExceed = budgetUsd != null && projectionUsd > budgetUsd;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <TrendingUp
          className="h-4 w-4 text-muted-foreground"
          aria-hidden
        />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {copy.costs.cards.projection}
        </p>
      </div>
      <p
        className={
          "mt-2 text-3xl font-semibold tabular-nums " +
          (willExceed ? "text-rose-600 dark:text-rose-400" : "")
        }
      >
        {formatBRL(projectionUsd)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {copy.costs.cards.projectionHint}
      </p>
      {willExceed ? (
        <p className="mt-2 text-[11px] font-medium text-rose-700 dark:text-rose-300">
          ⚠︎ Passa do seu limite em{" "}
          {formatBRL(projectionUsd - (budgetUsd ?? 0))}
        </p>
      ) : null}
    </div>
  );
}
