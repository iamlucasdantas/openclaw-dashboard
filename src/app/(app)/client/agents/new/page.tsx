import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { AgentForm } from "@/app/(app)/admin/agents/agent-form";

export default async function NewClientAgentPage() {
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
    <div className="space-y-6">
      <Link
        href="/client/agents"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>
      <PageHeader
        title="Novo agente"
        description="Crie um agente vinculado a um dos seus clientes."
      />
      <AgentForm
        mode="create"
        scope="client"
        tenants={tenants}
        defaultTenantId={tenants[0]?.id}
        cancelHref="/client/agents"
      />
    </div>
  );
}
