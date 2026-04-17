import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminAgentsPage() {
  const agents = await prisma.agent.findMany({
    include: { tenant: true },
    orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agentes</h1>
        <p className="text-sm text-muted-foreground">
          Todos os agentes registrados, agrupáveis por cliente.
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
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/tenants/${a.tenant.slug}`}
                    className="hover:underline"
                  >
                    {a.tenant.name}
                  </Link>
                </td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
