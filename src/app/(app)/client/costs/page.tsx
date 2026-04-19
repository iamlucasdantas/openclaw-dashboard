import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { copy, t } from "@/lib/copy";
import { PageHeader } from "@/components/form";
import { CostBarChart } from "@/components/cost-chart";
import { SpentCard } from "@/components/costs/SpentCard";
import { ProjectionCard } from "@/components/costs/ProjectionCard";
import { LimitCard } from "@/components/costs/LimitCard";
import { CostAlert } from "@/components/costs/CostAlert";
import { WhoIsWorking } from "@/components/costs/WhoIsWorking";
import { RecentDays } from "@/components/costs/RecentDays";
import { USD_BRL_RATE } from "@/lib/currency";
import { budgetSnapshot } from "@/lib/home-queries";
import {
  costByAgentThisMonth,
  costByDayThisMonth,
  costLast7Days,
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

  const [budget, byAgent, byDay, last7] = await Promise.all([
    budgetSnapshot(tenantIds),
    costByAgentThisMonth(agentIds),
    costByDayThisMonth(agentIds),
    costLast7Days(agentIds),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.costs.header.title}
        description={copy.costs.header.subtitle}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SpentCard
          spentUsd={budget.spentUsd}
          budgetUsd={budget.budgetUsd}
        />
        <ProjectionCard
          projectionUsd={budget.projectionUsd}
          budgetUsd={budget.budgetUsd}
        />
        <LimitCard
          spentUsd={budget.spentUsd}
          budgetUsd={budget.budgetUsd}
        />
      </div>

      <CostAlert
        pctOfBudget={budget.pctOfBudget}
        budgetUsd={budget.budgetUsd}
      />

      <section className="rounded-xl border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Consumo por dia (mês atual)</h2>
        </div>
        <div className="p-5">
          <CostBarChart points={byDay} />
        </div>
      </section>

      <WhoIsWorking items={byAgent} agentHrefPrefix="/client/agents" />

      <RecentDays points={last7} />

      <p className="text-[11px] text-muted-foreground">
        {t(copy.costs.disclaimer, {
          rate: USD_BRL_RATE.toFixed(2).replace(".", ","),
        })}
      </p>
    </div>
  );
}
