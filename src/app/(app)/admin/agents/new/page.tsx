import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { AgentForm } from "../agent-form";

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const params = await searchParams;
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const defaultTenant = params.tenant
    ? tenants.find((t) => t.slug === params.tenant)
    : undefined;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agents"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>
      <PageHeader
        title="Novo agente"
        description="Registra um novo agente e vincula a um cliente."
      />
      <AgentForm
        mode="create"
        tenants={tenants}
        defaultTenantId={defaultTenant?.id}
      />
    </div>
  );
}
