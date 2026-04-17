import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { effectiveStatus } from "@/lib/agent-status";
import { Button } from "@/components/form";
import { DeleteButton } from "@/components/delete-button";
import { StatusPill } from "@/components/status-pill";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { HeartbeatIntegration } from "@/components/heartbeat-integration";
import { GithubSection } from "@/components/github-integration";
import { deleteAgent } from "@/app/actions/agents";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await prisma.agent.findUnique({
    where: { agentId },
    include: {
      tenant: true,
      github: { include: { repos: { orderBy: [{ owner: "asc" }, { name: "asc" }] } } },
    },
  });
  if (!agent) notFound();

  const deleteThisAgent = async () => {
    "use server";
    await deleteAgent(agent.id);
  };

  const eff = effectiveStatus(agent);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: "Agentes", href: "/admin/agents" },
            { label: agent.name },
          ]}
        />
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {agent.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {agent.agentId}
              </code>{" "}
              ·{" "}
              <Link
                href={`/admin/tenants/${agent.tenant.slug}`}
                className="hover:underline"
              >
                {agent.tenant.name}
              </Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/agents/${agent.agentId}/edit`}>
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

      <HeartbeatIntegration agent={agent} scope="admin" />

      <GithubSection
        agentDbId={agent.id}
        scope="admin"
        integration={
          agent.github
            ? {
                id: agent.github.id,
                mode: agent.github.mode,
                scope: agent.github.scope,
                org: agent.github.org,
                defaultBranch: agent.github.defaultBranch,
                tokenPreview: agent.github.tokenPreview,
                repos: agent.github.repos.map((r) => ({
                  id: r.id,
                  owner: r.owner,
                  name: r.name,
                  role: r.role,
                })),
              }
            : null
        }
      />
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
