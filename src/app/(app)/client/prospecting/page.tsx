import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { CampaignCard } from "@/components/prospecting/CampaignCard";

export default async function ClientProspectingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const tenantIds = session.user.tenantIds ?? [];

  const campaigns = await prisma.prospectingCampaign.findMany({
    where: { tenantId: { in: tenantIds } },
    include: {
      tenant: { select: { name: true } },
      _count: { select: { leads: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  // Contagem de synced por campanha (query separada simples)
  const syncedCounts = await prisma.prospectingLead.groupBy({
    by: ["campaignId"],
    where: {
      syncStatus: "synced",
      campaign: { tenantId: { in: tenantIds } },
    },
    _count: { _all: true },
  });
  const syncedByCampaign = new Map(
    syncedCounts.map((r) => [r.campaignId, r._count._all])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospecção"
        description="Gere novos contatos automaticamente e sincronize com seu HighLevel."
        actions={
          <Link href="/client/prospecting/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nova campanha
            </Button>
          </Link>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title="Nenhuma campanha ainda"
          description="Configure uma vez (HighLevel + localização + nichos) e o sistema passa a trazer leads automaticamente."
          action={{
            label: "Criar minha primeira campanha",
            href: "/client/prospecting/new",
          }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const niches = parseNiches(c.niches);
            return (
              <CampaignCard
                key={c.id}
                href={`/client/prospecting/${c.id}`}
                name={c.name}
                state={c.state}
                areaLabel={c.areaLabel}
                radiusKm={c.radiusKm}
                niches={niches}
                leadsTotal={c._count.leads}
                leadsSynced={syncedByCampaign.get(c.id) ?? 0}
                nextRunAt={c.nextRunAt}
                schedule={c.schedule}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function parseNiches(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}
