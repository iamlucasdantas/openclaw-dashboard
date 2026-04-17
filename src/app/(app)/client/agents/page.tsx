import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ClientAgentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantIds = session.user.tenantIds ?? [];

  const agents = await prisma.agent.findMany({
    where: { tenantId: { in: tenantIds } },
    include: { tenant: true },
    orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meus agentes</h1>
        <p className="text-sm text-muted-foreground">
          Todos os agentes vinculados aos seus tenants.
        </p>
      </div>

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
              <tr key={a.id} className="border-t">
                <td className="px-5 py-3">{a.tenant.name}</td>
                <td className="px-5 py-3 font-medium">{a.name}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {a.agentId}
                  </code>
                </td>
                <td className="px-5 py-3">
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
                  Você ainda não tem agentes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
