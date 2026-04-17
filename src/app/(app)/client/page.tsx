import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Bot, Building2 } from "lucide-react";

export default async function ClientOverview() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantIds = session.user.tenantIds ?? [];
  if (tenantIds.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Você ainda não está vinculado a nenhum cliente.
        </p>
      </div>
    );
  }

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    include: {
      agents: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const totalAgents = tenants.reduce((sum, t) => sum + t.agents.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Seus tenants e agentes. Nenhum dado de outros clientes é exibido aqui.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Meus clientes</span>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums">
            {tenants.length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Meus agentes</span>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums">
            {totalAgents}
          </div>
        </div>
      </div>

      {tenants.map((t) => (
        <section key={t.id} className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">{t.name}</h2>
            {t.description ? (
              <p className="text-xs text-muted-foreground">{t.description}</p>
            ) : null}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2 text-left">Agente</th>
                <th className="px-5 py-2 text-left">Status</th>
                <th className="px-5 py-2 text-left">Modelo</th>
              </tr>
            </thead>
            <tbody>
              {t.agents.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/30">
                  <td className="px-5 py-2.5">
                    <Link
                      href={`/client/agents/${a.agentId}`}
                      className="font-medium hover:underline"
                    >
                      {a.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {a.agentId}
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs " +
                        (a.status === "online"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-muted-foreground">
                    {a.model ?? "—"}
                  </td>
                </tr>
              ))}
              {t.agents.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    Nenhum agente ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
