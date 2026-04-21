import Link from "next/link";
import { Bot, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { effectiveStatus } from "@/lib/agent-status";

export default async function ClientAgentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantIds = session.user.tenantIds ?? [];

  const agents = await prisma.agent.findMany({
    where: { tenantId: { in: tenantIds } },
    include: { tenant: true },
    orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }],
  });

  const canCreate = tenantIds.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus agentes"
        description="Todos os agentes vinculados aos seus tenants."
        actions={
          canCreate ? (
            <Link href="/client/agents/new">
              <Button>
                <Plus className="h-4 w-4" />
                Novo agente
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 text-left">Cliente</th>
              <th className="px-5 py-2.5 text-left">Agente</th>
              <th className="px-5 py-2.5 text-left">agentId</th>
              <th className="px-5 py-2.5 text-left">Status</th>
              <th className="px-5 py-2.5 text-left">Modelo</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-t hover:bg-muted/30">
                <td className="px-5 py-3">{a.tenant.name}</td>
                <td className="px-5 py-3 font-medium">
                  <Link
                    href={`/client/agents/${a.agentId}`}
                    className="hover:underline"
                  >
                    {a.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {a.agentId}
                  </code>
                </td>
                <td className="px-5 py-3">
                  <StatusPill status={effectiveStatus(a)} scope="client" />
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {a.model ?? "—"}
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <EmptyState
                colSpan={5}
                icon={<Bot className="h-5 w-5" />}
                title="Você ainda não tem agentes"
                description={
                  canCreate
                    ? "Crie seu primeiro agente em um dos seus clientes."
                    : "Peça ao admin para vincular você a um cliente."
                }
                action={
                  canCreate
                    ? { label: "Novo agente", href: "/client/agents/new" }
                    : undefined
                }
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
