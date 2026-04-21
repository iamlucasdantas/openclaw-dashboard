import Link from "next/link";
import { DollarSign, AlertTriangle } from "lucide-react";
import { copy, t } from "@/lib/copy";
import { formatBRL } from "@/lib/currency";
import type { BudgetSnapshot as Snapshot } from "@/lib/home-queries";

export function BudgetSnapshotCard({ snapshot }: { snapshot: Snapshot }) {
  const {
    spentUsd,
    budgetUsd,
    projectionUsd,
    pctOfBudget,
  } = snapshot;

  const noLimit = budgetUsd == null;
  const critical = !noLimit && pctOfBudget !== null && pctOfBudget >= 100;
  const warn = !noLimit && pctOfBudget !== null && pctOfBudget >= 70 && !critical;

  const barColor = critical
    ? "bg-rose-500"
    : warn
      ? "bg-amber-500"
      : "bg-emerald-500";

  const pctClamped = Math.min(100, pctOfBudget ?? 0);

  return (
    <section className="flex h-full flex-col rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-semibold">
          {copy.home.sections.budgetTitle}
        </h2>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        <p className="text-sm">
          <span className="text-lg font-semibold tabular-nums">
            {formatBRL(spentUsd)}
          </span>{" "}
          <span className="text-xs text-muted-foreground">
            {noLimit
              ? copy.home.sections.budgetUnlimited
              : t(copy.home.sections.budgetOf, {
                  budget: formatBRL(budgetUsd ?? 0),
                })}
          </span>
        </p>

        {!noLimit ? (
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${barColor}`}
              style={{ width: `${pctClamped}%` }}
              aria-label={`${pctClamped}% do limite`}
            />
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {t(copy.home.sections.budgetProjection, {
            value: formatBRL(projectionUsd),
          })}
        </p>

        {critical ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {copy.home.sections.budgetAlertCritical}
          </p>
        ) : warn ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {t(copy.home.sections.budgetAlertWarn, { pct: pctOfBudget! })}
          </p>
        ) : null}

        <Link
          href="/client/costs"
          className="mt-auto pt-3 text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {noLimit
            ? copy.home.sections.budgetUnlimitedCta + " →"
            : copy.home.sections.seeCosts}
        </Link>
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground">
        Valores convertidos de USD a R$ {"5,50"} (cotação aproximada).
      </p>
    </section>
  );
}
