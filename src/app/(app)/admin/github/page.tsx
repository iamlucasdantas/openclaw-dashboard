import Link from "next/link";
import { Github } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";

const MODE_LABEL: Record<string, string> = {
  "gh-cli": "gh CLI",
  mcp: "MCP",
  api: "API",
};

const SCOPE_LABEL: Record<string, string> = {
  read: "read",
  issues: "issues",
  prs: "issues+PRs",
  admin: "admin",
};

export default async function AdminGithubPage() {
  const integrations = await prisma.githubIntegration.findMany({
    include: {
      agent: { include: { tenant: true } },
      repos: { orderBy: [{ owner: "asc" }, { name: "asc" }] },
    },
    orderBy: [{ agent: { tenant: { name: "asc" } } }, { agent: { name: "asc" } }],
  });

  const totalRepos = integrations.reduce((s, i) => s + i.repos.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações GitHub"
        description={`${integrations.length} agente(s) com GitHub configurado · ${totalRepos} repositório(s) vinculado(s).`}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 text-left">Cliente</th>
              <th className="px-5 py-2.5 text-left">Agente</th>
              <th className="px-5 py-2.5 text-left">Modo</th>
              <th className="px-5 py-2.5 text-left">Escopo</th>
              <th className="px-5 py-2.5 text-left">Org</th>
              <th className="px-5 py-2.5 text-left">Repos</th>
              <th className="px-5 py-2.5 text-left">Token</th>
            </tr>
          </thead>
          <tbody>
            {integrations.map((i) => (
              <tr key={i.id} className="border-t align-top">
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/tenants/${i.agent.tenant.slug}`}
                    className="hover:underline"
                  >
                    {i.agent.tenant.name}
                  </Link>
                </td>
                <td className="px-5 py-3 font-medium">
                  <Link
                    href={`/admin/agents/${i.agent.agentId}`}
                    className="hover:underline"
                  >
                    {i.agent.name}
                  </Link>
                  <div className="text-[11px] text-muted-foreground">
                    {i.agent.agentId}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {MODE_LABEL[i.mode] ?? i.mode}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs">{SCOPE_LABEL[i.scope] ?? i.scope}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {i.org ?? "—"}
                </td>
                <td className="px-5 py-3 text-xs">
                  {i.repos.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="space-y-0.5">
                      {i.repos.slice(0, 3).map((r) => (
                        <div key={r.id} className="font-mono">
                          {r.owner}/{r.name}
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            ({r.role})
                          </span>
                        </div>
                      ))}
                      {i.repos.length > 3 && (
                        <div className="text-[11px] text-muted-foreground">
                          +{i.repos.length - 3} mais…
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {i.tokenPreview ? `…${i.tokenPreview}` : "—"}
                </td>
              </tr>
            ))}
            {integrations.length === 0 && (
              <EmptyState
                colSpan={7}
                icon={<Github className="h-5 w-5" />}
                title="Nenhum agente com GitHub configurado"
                description="Configure a integração na página de detalhe de cada agente."
                action={{ label: "Ver agentes", href: "/admin/agents" }}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
