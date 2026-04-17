import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      agents: { orderBy: { name: "asc" } },
      memberships: { include: { user: true } },
    },
  });

  if (!tenant) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar para clientes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {tenant.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {tenant.slug}
          </code>{" "}
          · criado em {formatDate(tenant.createdAt)}
        </p>
        {tenant.description ? (
          <p className="mt-2 text-sm">{tenant.description}</p>
        ) : null}
      </div>

      <section className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            Agentes ({tenant.agents.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2 text-left">Nome</th>
              <th className="px-5 py-2 text-left">agentId</th>
              <th className="px-5 py-2 text-left">Status</th>
              <th className="px-5 py-2 text-left">Modelo</th>
            </tr>
          </thead>
          <tbody>
            {tenant.agents.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-5 py-2.5 font-medium">{a.name}</td>
                <td className="px-5 py-2.5 text-muted-foreground">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {a.agentId}
                  </code>
                </td>
                <td className="px-5 py-2.5">
                  <StatusPill status={a.status} />
                </td>
                <td className="px-5 py-2.5 text-muted-foreground">
                  {a.model ?? "—"}
                </td>
              </tr>
            ))}
            {tenant.agents.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-muted-foreground"
                >
                  Nenhum agente para este cliente ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            Usuários ({tenant.memberships.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2 text-left">Nome</th>
              <th className="px-5 py-2 text-left">Email</th>
              <th className="px-5 py-2 text-left">Papéis</th>
            </tr>
          </thead>
          <tbody>
            {tenant.memberships.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-5 py-2.5 font-medium">{m.user.name}</td>
                <td className="px-5 py-2.5 text-muted-foreground">
                  {m.user.email}
                </td>
                <td className="px-5 py-2.5">
                  <span className="mr-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                    cliente
                  </span>
                  {m.user.isAdmin && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      admin
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {tenant.memberships.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-8 text-center text-sm text-muted-foreground"
                >
                  Nenhum usuário vinculado a este cliente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
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
