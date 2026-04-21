import Link from "next/link";
import { Bot, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { TableFilters } from "@/components/table-filters";
import { effectiveStatus } from "@/lib/agent-status";

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tenant?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const [allAgents, tenants] = await Promise.all([
    prisma.agent.findMany({
      include: { tenant: true },
      orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  // Filtros em memória — lista toda é pequena o suficiente
  const agents = allAgents.filter((a) => {
    if (q) {
      const hay = `${a.name} ${a.agentId} ${a.model ?? ""} ${a.tenant.name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (sp.tenant && a.tenant.slug !== sp.tenant) return false;
    if (sp.status) {
      const eff = effectiveStatus(a);
      if (eff !== sp.status) return false;
    }
    return true;
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

      <TableFilters
        placeholder="Buscar por nome, agentId, cliente, modelo..."
        filters={[
          {
            key: "tenant",
            label: "Cliente",
            options: tenants.map((t) => ({ value: t.slug, label: t.name })),
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "online", label: "online" },
              { value: "stale", label: "sem heartbeat" },
              { value: "degraded", label: "degradado" },
              { value: "offline", label: "offline" },
            ],
          },
        ]}
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
            {agents.length === 0 && allAgents.length > 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Nenhum agente bate com esses filtros.
                </td>
              </tr>
            )}
            {allAgents.length === 0 && (
              <EmptyState
                colSpan={5}
                icon={<Bot className="h-5 w-5" />}
                title="Nenhum agente cadastrado"
                description="Registre o primeiro agente e vincule a um cliente."
                action={{ label: "Novo agente", href: "/admin/agents/new" }}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
