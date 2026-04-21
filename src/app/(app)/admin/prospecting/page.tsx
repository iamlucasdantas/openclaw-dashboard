import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { CampaignCard } from "@/components/prospecting/CampaignCard";

export default async function AdminProspectingPage() {
  const campaigns = await prisma.prospectingCampaign.findMany({
    include: {
      tenant: { select: { name: true, slug: true } },
      _count: { select: { leads: true } },
    },
    orderBy: [{ tenant: { name: "asc" } }, { createdAt: "desc" }],
  });

  const syncedCounts = await prisma.prospectingLead.groupBy({
    by: ["campaignId"],
    where: { syncStatus: "synced" },
    _count: { _all: true },
  });
  const syncedByCampaign = new Map(
    syncedCounts.map((r) => [r.campaignId, r._count._all])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospecção"
        description="Campanhas de prospecção de todos os clientes da infraestrutura."
        actions={
          <Link href="/admin/prospecting/new">
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
          title="Nenhuma campanha configurada"
          description="Crie uma campanha por cliente pra gerar leads automaticamente."
          action={{ label: "Criar campanha", href: "/admin/prospecting/new" }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const niches = parseNiches(c.niches);
            return (
              <CampaignCard
                key={c.id}
                href={`/admin/prospecting/${c.id}`}
                name={c.name}
                state={c.state}
                tenantName={c.tenant.name}
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
