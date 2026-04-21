import { copy } from "@/lib/copy";
import { formatBRL } from "@/lib/currency";

export function RecentDays({
  points,
}: {
  points: { date: string; costUsd: number }[];
}) {
  if (points.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {copy.costs.history.empty}
      </section>
    );
  }

  const reversed = [...points].reverse(); // mais recente primeiro
  const max = Math.max(...points.map((p) => p.costUsd), 0.01);

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-5 py-3">
        <h2 className="text-sm font-semibold">{copy.costs.history.title}</h2>
      </div>
      <ul className="divide-y">
        {reversed.map((p, i) => (
          <li
            key={p.date}
            className="flex items-center gap-3 px-5 py-2.5 text-sm"
          >
            <div className="w-24 shrink-0">
              <span className="text-muted-foreground">{labelFor(p.date, i)}</span>
            </div>
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary/60"
                  style={{
                    width: `${Math.max(2, Math.round((p.costUsd / max) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <div className="w-20 shrink-0 text-right font-medium tabular-nums">
              {formatBRL(p.costUsd)}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function labelFor(iso: string, indexFromToday: number): string {
  if (indexFromToday === 0) return "Hoje";
  if (indexFromToday === 1) return "Ontem";
  if (indexFromToday === 2) return "Anteontem";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}
