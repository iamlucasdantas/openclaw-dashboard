import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { AgentForm } from "../../agent-form";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const [agent, tenants] = await Promise.all([
    prisma.agent.findUnique({ where: { agentId } }),
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  if (!agent) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/agents/${agent.agentId}`}
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
        tenants={tenants}
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
