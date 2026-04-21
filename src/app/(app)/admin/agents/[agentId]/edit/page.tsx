import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { DangerZone } from "@/components/danger-zone";
import { TypeToConfirmButton } from "@/components/type-to-confirm";
import { AgentForm } from "../../agent-form";
import { deleteAgent } from "@/app/actions/agents";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const [agent, tenants] = await Promise.all([
    prisma.agent.findUnique({
      where: { agentId },
      include: {
        github: true,
        _count: { select: { skills: true, crons: true } },
      },
    }),
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  if (!agent) notFound();

  const deleteThisAgent = async () => {
    "use server";
    await deleteAgent(agent.id);
  };

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

      <DangerZone
        title={`Excluir o agente "${agent.name}"`}
        description="Operações destrutivas ficam isoladas aqui pra evitar clique acidental. Use com calma."
      >
        <TypeToConfirmButton
          action={deleteThisAgent}
          confirmText={agent.name}
          triggerLabel="Excluir agente"
          title={`Excluir o agente "${agent.name}"?`}
          description="Esta ação é permanente e vai remover todos os dados vinculados ao agente."
          impactLines={[
            `Apagar ${agent._count.crons} tarefa(s) agendada(s)`,
            `Remover ${agent._count.skills} habilidade(s) instalada(s)`,
            "Apagar histórico dos últimos 30 dias",
            agent.github ? "Remover vínculo com o GitHub" : null,
          ].filter((x): x is string => !!x)}
          ctaLabel={`Excluir ${agent.name}`}
        />
      </DangerZone>
    </div>
  );
}
