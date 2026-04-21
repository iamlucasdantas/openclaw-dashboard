import { formatUsd } from "@/lib/costs";

export function CostBarChart({
  points,
}: {
  points: { date: string; costUsd: number }[];
}) {
  if (points.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">
        Sem dados no período.
      </div>
    );
  }
  const max = Math.max(...points.map((p) => p.costUsd), 0.01);
  return (
    <div className="flex h-40 items-end gap-1">
      {points.map((p) => {
        const h = Math.max(2, Math.round((p.costUsd / max) * 100));
        const dayLabel = p.date.slice(8);
        return (
          <div
            key={p.date}
            title={`${p.date}: ${formatUsd(p.costUsd)}`}
            className="group flex flex-1 flex-col items-center gap-1"
          >
            <div
              className="w-full rounded-t bg-primary/70 transition group-hover:bg-primary"
              style={{ height: `${h}%` }}
            />
            <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
