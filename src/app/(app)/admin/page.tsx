import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Building2, Bot, Users } from "lucide-react";

export default async function AdminOverview() {
  const [tenants, agents, users, recentAgents] = await Promise.all([
    prisma.tenant.count(),
    prisma.agent.count(),
    prisma.user.count(),
    prisma.agent.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { tenant: true },
    }),
  ]);

  const stats = [
    { label: "Clientes", value: tenants, icon: Building2, href: "/admin/tenants" },
    { label: "Agentes", value: agents, icon: Bot, href: "/admin/agents" },
    { label: "Usuários", value: users, icon: Users, href: "/admin/users" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Consolidado de todos os tenants e agentes da infraestrutura OpenClaw.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border bg-card p-5 transition hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-3xl font-semibold tabular-nums">
              {s.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Agentes recentes</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2 text-left">Agente</th>
              <th className="px-5 py-2 text-left">Cliente</th>
              <th className="px-5 py-2 text-left">Status</th>
              <th className="px-5 py-2 text-left">Modelo</th>
            </tr>
          </thead>
          <tbody>
            {recentAgents.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-5 py-2.5">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.agentId}
                  </div>
                </td>
                <td className="px-5 py-2.5">{a.tenant.name}</td>
                <td className="px-5 py-2.5">
                  <StatusPill status={a.status} />
                </td>
                <td className="px-5 py-2.5 text-muted-foreground">
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

function StatusPill({ status }: { status: string }) {
  const ok = status === "online";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium " +
        (ok
          ? "bg-emerald-50 text-emerald-700"
          : "bg-muted text-muted-foreground")
      }
    >
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (ok ? "bg-emerald-500" : "bg-muted-foreground/60")
        }
      />
      {status}
    </span>
  );
}
