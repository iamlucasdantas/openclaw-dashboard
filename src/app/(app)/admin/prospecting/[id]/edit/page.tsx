import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { ProspectingWizard } from "@/components/prospecting/ProspectingWizard";

export default async function EditProspectingAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.prospectingCampaign.findUnique({ where: { id } });
  if (!c) notFound();

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const niches = (() => {
    try {
      return JSON.parse(c.niches);
    } catch {
      return [];
    }
  })();
  const filters = (() => {
    try {
      return JSON.parse(c.filters);
    } catch {
      return {};
    }
  })();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/admin/prospecting/${id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        Voltar
      </Link>
      <PageHeader title={`Editar ${c.name}`} />
      <ProspectingWizard
        mode="edit"
        scope="admin"
        tenants={tenants}
        cancelHref={`/admin/prospecting/${id}`}
        campaignId={id}
        initial={{
          tenantId: c.tenantId,
          name: c.name,
          ghlLocationId: c.ghlLocationId ?? "",
          ghlApiKey: "",
          areaLabel: c.areaLabel,
          radiusKm: c.radiusKm,
          niches,
          filters,
          schedule: c.schedule as any,
          scheduleTime: c.scheduleTime,
          autoExpand: c.autoExpand,
          expandAfterDays: c.expandAfterDays,
          expandStepKm: c.expandStepKm,
          maxRadiusKm: c.maxRadiusKm,
        }}
      />
    </div>
  );
}
