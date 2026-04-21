import Link from "next/link";
import { DollarSign, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/form";
import { CostBarChart } from "@/components/cost-chart";
import { BudgetBar } from "@/components/budget-bar";
import { prisma } from "@/lib/prisma";
import { formatTokens, formatUsd } from "@/lib/costs";
import {
  costByAgentThisMonth,
  costByDayThisMonth,
  costByTenantThisMonth,
  costSummaryForAgents,
} from "@/lib/costs-queries";
import { budgetSnapshot } from "@/lib/home-queries";

export default async function AdminCostsPage() {
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  const tenantIds = tenants.map((t) => t.id);

  const [summary, byAgent, byTenant, byDay, budget] = await Promise.all([
    costSummaryForAgents(),
    costByAgentThisMonth(),
    costByTenantThisMonth(),
    costByDayThisMonth(),
    budgetSnapshot(tenantIds),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custos"
        description="Uso e custo de LLM. Dados de demonstração (30 dias, eventos sintéticos)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Hoje" value={formatUsd(summary.today)} />
        <SummaryCard label="Semana" value={formatUsd(summary.week)} />
        <SummaryCard label="Mês" value={formatUsd(summary.month)} highlight />
        <SummaryCard
          label="Projeção fim de mês"
          value={formatUsd(budget.projectionUsd)}
          hint="se o ritmo se mantiver"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Custo por dia (mês atual)</h2>
        </div>
        <div className="p-5">
          <CostBarChart points={byDay} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Top clientes (mês)</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2 text-left">Cliente</th>
                <th className="px-5 py-2 text-right">Tokens</th>
                <th className="px-5 py-2 text-right">Custo</th>
              </tr>
            </thead>
            <tbody>
              {byTenant.map((t) => (
                <tr key={t.tenantId} className="border-t align-top">
                  <td className="px-5 py-2.5">
                    <Link
                      href={`/admin/tenants/${t.slug}`}
                      className="font-medium hover:underline"
                    >
                      {t.name}
                    </Link>
                    {t.budgetUsd ? (
                      <div className="mt-1 w-64">
                        <BudgetBar used={t.costUsd} budget={t.budgetUsd} />
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatTokens(t.tokens)}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-medium">
                    {formatUsd(t.costUsd)}
                  </td>
                </tr>
              ))}
              {byTenant.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-xs text-muted-foreground"
                  >
                    Sem uso no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Top agentes (mês)</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2 text-left">Agente</th>
                <th className="px-5 py-2 text-right">Tokens</th>
                <th className="px-5 py-2 text-right">Custo</th>
              </tr>
            </thead>
            <tbody>
              {byAgent.slice(0, 10).map((a) => (
                <tr key={a.agentDbId} className="border-t align-top">
                  <td className="px-5 py-2.5">
                    <Link
                      href={`/admin/agents/${a.agentId}`}
                      className="font-medium hover:underline"
                    >
                      {a.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {a.tenantName}
                    </div>
                    {a.budgetUsd ? (
                      <div className="mt-1 w-64">
                        <BudgetBar used={a.costUsd} budget={a.budgetUsd} />
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatTokens(a.tokens)}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-medium">
                    {formatUsd(a.costUsd)}
                  </td>
                </tr>
              ))}
              {byAgent.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-xs text-muted-foreground"
                  >
                    Sem uso no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
  hint,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-5 ${
        highlight ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon ?? <DollarSign className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? (
        <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
