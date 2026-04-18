import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { AgentForm } from "@/app/(app)/admin/agents/agent-form";

export default async function ClientEditAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const tenantIds = session.user.tenantIds ?? [];

  const { agentId } = await params;
  const agent = await prisma.agent.findUnique({ where: { agentId } });
  if (!agent) notFound();
  if (!tenantIds.includes(agent.tenantId)) notFound();

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/client/agents/${agent.agentId}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>
      <PageHeader
        title={`Editar ${agent.name}`}
        description="Atualiza os dados do agente."
      />
      <AgentForm
        mode="edit"
        scope="client"
        tenants={tenants}
        cancelHref={`/client/agents/${agent.agentId}`}
        initial={{
          id: agent.id,
          name: agent.name,
          agentId: agent.agentId,
          tenantId: agent.tenantId,
          persona: agent.persona,
          model: agent.model,
          status: agent.status,
        }}
      />
    </div>
  );
}
