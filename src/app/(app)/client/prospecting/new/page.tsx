import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { ProspectingWizard } from "@/components/prospecting/ProspectingWizard";

export default async function NewProspectingClient() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const tenantIds = session.user.tenantIds ?? [];
  if (tenantIds.length === 0) redirect("/client");

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/client/prospecting"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        Voltar
      </Link>
      <PageHeader
        title="Nova campanha de prospecção"
        description="Em 4 passos rápidos você deixa o sistema procurando leads pra você."
      />
      <ProspectingWizard
        mode="create"
        scope="client"
        tenants={tenants}
        cancelHref="/client/prospecting"
      />
    </div>
  );
}
