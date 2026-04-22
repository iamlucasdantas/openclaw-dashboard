import Link from "next/link";
import { MapPin, Target, Pause, Play } from "lucide-react";

type Props = {
  href: string;
  name: string;
  state: string;
  tenantName?: string;
  areaLabel: string;
  radiusKm: number;
  niches: string[];
  leadsTotal: number;
  leadsSynced: number;
  nextRunAt: Date | null;
  schedule: string;
};

export function CampaignCard({
  href,
  name,
  state,
  tenantName,
  areaLabel,
  radiusKm,
  niches,
  leadsTotal,
  leadsSynced,
  nextRunAt,
  schedule,
}: Props) {
  const pct =
    leadsTotal > 0 ? Math.round((leadsSynced / leadsTotal) * 100) : 0;
  const isPaused = state !== "active";

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition hover:border-primary hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Target className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold">{name}</h3>
            {tenantName ? (
              <p className="text-[11px] text-muted-foreground">{tenantName}</p>
            ) : null}
          </div>
        </div>
        <span
          className={
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium " +
            (isPaused
              ? "bg-muted text-muted-foreground"
              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20")
          }
        >
          {isPaused ? (
            <Pause className="h-3 w-3" aria-hidden />
          ) : (
            <Play className="h-3 w-3" aria-hidden />
          )}
          {isPaused ? "Pausada" : "Ativa"}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">
          {areaLabel} · raio {radiusKm}km
        </span>
      </div>

      {niches.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {niches.slice(0, 3).map((n) => (
            <span
              key={n}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px]"
            >
              {n}
            </span>
          ))}
          {niches.length > 3 ? (
            <span className="text-[10px] text-muted-foreground">
              +{niches.length - 3}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto border-t pt-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {leadsTotal} leads · {leadsSynced} sincronizados
          </span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {schedule === "manual"
            ? "Só manualmente"
            : nextRunAt
              ? `Próxima busca: ${nextRunAt.toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Sem próxima execução agendada"}
        </p>
      </div>
    </Link>
  );
}
