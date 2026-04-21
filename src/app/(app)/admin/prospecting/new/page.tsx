import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { ProspectingWizard } from "@/components/prospecting/ProspectingWizard";

export default async function NewProspectingAdmin() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/prospecting"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        Voltar
      </Link>
      <PageHeader
        title="Nova campanha de prospecção"
        description="Conecta a subconta da HighLevel de um cliente e define onde e o que buscar."
      />
      <ProspectingWizard
        mode="create"
        scope="admin"
        tenants={tenants}
        cancelHref="/admin/prospecting"
      />
    </div>
  );
}
