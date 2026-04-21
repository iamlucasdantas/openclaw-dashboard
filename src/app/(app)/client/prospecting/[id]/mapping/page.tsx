import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MappingForm } from "@/components/prospecting/MappingForm";

export default async function MappingClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const tenantIds = session.user.tenantIds ?? [];

  const { id } = await params;
  const c = await prisma.prospectingCampaign.findUnique({ where: { id } });
  if (!c) notFound();
  if (!tenantIds.includes(c.tenantId)) notFound();

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
          { label: "Prospecção", href: "/client/prospecting" },
          { label: c.name, href: `/client/prospecting/${c.id}` },
          { label: "Mapeamento" },
        ]}
      />
      <PageHeader
        title="Mapeamento de campos"
        description="Defina qual campo do lead vai para qual campo do contato no HighLevel. Serve pra próximos leads sincronizados."
      />
      <MappingForm campaignId={c.id} initial={mapping} />
    </div>
  );
}
