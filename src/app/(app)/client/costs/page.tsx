import Link from "next/link";
import { DollarSign } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { CostBarChart } from "@/components/cost-chart";
import { formatTokens, formatUsd } from "@/lib/costs";
import {
  costByAgentThisMonth,
  costByDayThisMonth,
  costSummaryForAgents,
} from "@/lib/costs-queries";

export default async function ClientCostsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantIds = session.user.tenantIds ?? [];
  const agents = await prisma.agent.findMany({
    where: { tenantId: { in: tenantIds } },
    select: { id: true },
  });
  const agentIds = agents.map((a) => a.id);

  const [summary, byAgent, byDay] = await Promise.all([
    costSummaryForAgents(agentIds),
    costByAgentThisMonth(agentIds),
    costByDayThisMonth(agentIds),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custos"
        description="Uso e custo dos seus agentes. Dados de demonstração."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard label="Hoje" value={formatUsd(summary.today)} />
        <SummaryCard label="Semana" value={formatUsd(summary.week)} />
        <SummaryCard label="Mês" value={formatUsd(summary.month)} highlight />
        <SummaryCard
          label="Tokens (mês)"
          value={formatTokens(summary.totalTokensMonth)}
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

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Custo por agente (mês)</h2>
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
            {byAgent.map((a) => (
              <tr key={a.agentDbId} className="border-t">
                <td className="px-5 py-2.5">
                  <Link
                    href={`/client/agents/${a.agentId}`}
                    className="font-medium hover:underline"
                  >
                    {a.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {a.tenantName}
                  </div>
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
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-5 ${
        highlight ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
