import Link from "next/link";
import { Pencil } from "lucide-react";
import { copy, t } from "@/lib/copy";
import { formatBRL } from "@/lib/currency";
import { Button } from "@/components/form";
import { TypeToConfirmButton } from "@/components/type-to-confirm";
import { BudgetBar } from "@/components/budget-bar";
import { CronsCalendar, type CalendarCron } from "@/components/crons-calendar";
import { formatClock, formatDayLabel } from "@/lib/schedule";

type Props = {
  counts: { today: number; week: number; month: number };
  usedThisMonthUsd: number;
  budgetUsd: number | null;
  upcoming: { cronId: string; name: string; when: Date }[];
  crons: CalendarCron[];
  agentHrefPrefix: "/admin/agents" | "/client/agents";
  editHref: string;
  scheduleHref: string;
  /** Opcional. Null = não renderiza seção "Ações" (caso admin, onde
   *  excluir foi movido pra Zona de perigo em /edit). */
  onDeleteAction?: (() => Promise<void>) | null;
  agentName: string;
  deleteImpact?: string[];
};

export function TabSummary({
  counts,
  usedThisMonthUsd,
  budgetUsd,
  upcoming,
  crons,
  agentHrefPrefix,
  editHref,
  scheduleHref,
  onDeleteAction,
  agentName,
  deleteImpact = [],
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard value={counts.today} label={copy.agent.detail.stats.today} />
        <StatCard value={counts.week} label={copy.agent.detail.stats.week} />
        <StatCard value={counts.month} label={copy.agent.detail.stats.month} />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">
          {copy.costs.header.title} do mês
        </h2>
        <div className="mt-3 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums">
              {formatBRL(usedThisMonthUsd)}
            </span>
            {budgetUsd ? (
              <span className="text-xs text-muted-foreground">
                de {formatBRL(budgetUsd)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {copy.home.sections.budgetUnlimited}
              </span>
            )}
          </div>
          {budgetUsd ? (
            <BudgetBar used={usedThisMonthUsd} budget={budgetUsd} />
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">
            {copy.agent.detail.upcomingTitle}
          </h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            {copy.agent.detail.upcomingEmpty}
          </p>
        ) : (
          <ul className="divide-y">
            {upcoming.map((u, i) => (
              <li
                key={`${u.cronId}-${i}`}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {formatDayLabel(u.when)}, {formatClock(u.when)}
                  </span>
                  <p className="font-medium">{u.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t px-5 py-3">
          <Link
            href={scheduleHref}
            className="text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copy.agent.detail.seeSchedule} →
          </Link>
        </div>
      </section>

      {crons.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Calendário do assistente</h2>
          <CronsCalendar
            crons={crons}
            scopeLinks={{ agentHrefPrefix }}
          />
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-semibold">
          {copy.agent.detail.actionsArea}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link href={editHref}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {copy.agent.actions.edit}
            </Button>
          </Link>
          {onDeleteAction ? (
            <TypeToConfirmButton
              action={onDeleteAction}
              confirmText={agentName}
              triggerLabel={copy.agent.actions.delete}
              title={`Desligar o assistente "${agentName}"?`}
              description="Esta ação não pode ser desfeita."
              impactLines={deleteImpact}
              ctaLabel={`Desligar ${agentName}`}
              cancelLabel="Manter ativo"
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-3xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
