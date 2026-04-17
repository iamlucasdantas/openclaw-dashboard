import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { effectiveStatus } from "@/lib/agent-status";
import { Button } from "@/components/form";
import { DeleteButton } from "@/components/delete-button";
import { StatusPill } from "@/components/status-pill";
import { HeartbeatIntegration } from "@/components/heartbeat-integration";
import { deleteAgent } from "@/app/actions/agents";

export default async function ClientAgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const tenantIds = session.user.tenantIds ?? [];

  const { agentId } = await params;
  const agent = await prisma.agent.findUnique({
    where: { agentId },
    include: { tenant: true },
  });
  if (!agent) notFound();
  if (!tenantIds.includes(agent.tenantId)) notFound();

  const deleteThisAgent = async () => {
    "use server";
    await deleteAgent(agent.id, "client");
  };

  const eff = effectiveStatus(agent);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/client/agents"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar para meus agentes
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {agent.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {agent.agentId}
              </code>{" "}
              · {agent.tenant.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/client/agents/${agent.agentId}/edit`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <form action={deleteThisAgent}>
              <DeleteButton
                message={`Excluir agente "${agent.name}"? Esta ação não pode ser desfeita.`}
              />
            </form>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Status
          </div>
          <div className="mt-2">
            <StatusPill status={eff} />
          </div>
        </div>
        <Card label="Modelo" value={agent.model ?? "—"} />
        <Card label="Criado em" value={formatDate(agent.createdAt)} />
        <Card label="Último heartbeat" value={formatDate(agent.lastHeartbeatAt)} />
      </div>

      {agent.persona ? (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Persona</h2>
          </div>
          <div className="px-5 py-4 text-sm">{agent.persona}</div>
        </section>
      ) : null}

      <HeartbeatIntegration agent={agent} scope="client" />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
