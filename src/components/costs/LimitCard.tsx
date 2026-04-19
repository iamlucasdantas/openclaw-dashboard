import Link from "next/link";
import { copy, t } from "@/lib/copy";
import { formatBRL } from "@/lib/currency";

export function LimitCard({
  spentUsd,
  budgetUsd,
  settingsHref,
}: {
  spentUsd: number;
  budgetUsd: number | null;
  settingsHref?: string;
}) {
  const pct =
    budgetUsd && budgetUsd > 0
      ? Math.min(100, Math.round((spentUsd / budgetUsd) * 100))
      : null;

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {copy.costs.cards.limit}
      </p>
      {budgetUsd ? (
        <>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {formatBRL(budgetUsd)}
          </p>
          {pct != null ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t(copy.costs.cards.limitUsed, { pct })}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy.costs.cards.noLimit}
          </p>
          {settingsHref ? (
            <Link
              href={settingsHref}
              className="mt-3 inline-block text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Definir limite →
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
