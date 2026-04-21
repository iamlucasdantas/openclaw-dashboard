import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MappingForm } from "@/components/prospecting/MappingForm";

export default async function MappingAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.prospectingCampaign.findUnique({ where: { id } });
  if (!c) notFound();

  const mapping: Record<string, string> = (() => {
    try {
      const p = JSON.parse(c.fieldMap);
      return typeof p === "object" && p !== null ? p : {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Prospecção", href: "/admin/prospecting" },
          { label: c.name, href: `/admin/prospecting/${c.id}` },
          { label: "Mapeamento" },
        ]}
      />
      <PageHeader
        title="Mapeamento de campos"
        description="Como cada campo do lead encontrado é criado no contato da HighLevel."
      />
      <MappingForm campaignId={c.id} initial={mapping} />
    </div>
  );
}
