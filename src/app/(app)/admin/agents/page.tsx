import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { StatusPill } from "@/components/status-pill";
import { effectiveStatus } from "@/lib/agent-status";

export default async function AdminAgentsPage() {
  const agents = await prisma.agent.findMany({
    include: { tenant: true },
    orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agentes"
        description="Todos os agentes registrados. Status exibido é o efetivo (heartbeat + manual)."
        actions={
          <Link href="/admin/agents/new">
            <Button>
              <Plus className="h-4 w-4" />
              Novo agente
            </Button>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border bg-card">
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
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/tenants/${a.tenant.slug}`}
                    className="hover:underline"
                  >
                    {a.tenant.name}
                  </Link>
                </td>
                <td className="px-5 py-3 font-medium">
                  <Link
                    href={`/admin/agents/${a.agentId}`}
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
                  <StatusPill status={effectiveStatus(a)} />
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {a.model ?? "—"}
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum agente cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
