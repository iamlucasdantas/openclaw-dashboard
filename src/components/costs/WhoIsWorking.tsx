import Link from "next/link";
import { copy } from "@/lib/copy";
import { formatBRL } from "@/lib/currency";
import { formatTokens } from "@/lib/costs";

export type WhoItem = {
  agentDbId: string;
  agentId: string;
  name: string;
  tenantName: string;
  costUsd: number;
  tokens: number;
};

export function WhoIsWorking({
  items,
  agentHrefPrefix,
}: {
  items: WhoItem[];
  agentHrefPrefix: "/client/agents" | "/admin/agents";
}) {
  if (items.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        {copy.costs.whoWorking.empty}
      </section>
    );
  }

  const total = Math.max(...items.map((i) => i.costUsd), 0.01);

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-5 py-3">
        <h2 className="text-sm font-semibold">{copy.costs.whoWorking.title}</h2>
      </div>
      <ul className="divide-y">
        {items.slice(0, 10).map((i) => {
          const pct = Math.round((i.costUsd / total) * 100);
          return (
            <li key={i.agentDbId} className="px-5 py-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`${agentHrefPrefix}/${i.agentId}`}
                    className="truncate text-sm font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    🤖 {i.name}
                  </Link>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {i.tenantName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatBRL(i.costUsd)}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {formatTokens(i.tokens)} tokens
                  </p>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.max(2, pct)}%` }}
                  aria-label={`${pct}% do maior consumo`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
