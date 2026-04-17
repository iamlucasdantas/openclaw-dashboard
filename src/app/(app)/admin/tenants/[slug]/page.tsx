import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/form";
import { DeleteButton } from "@/components/delete-button";
import { StatusPill } from "@/components/status-pill";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { effectiveStatus } from "@/lib/agent-status";
import { deleteTenant } from "@/app/actions/tenants";

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

  const agentCount = tenant.agents.length;
  const userCount = tenant.memberships.length;

  const deleteThisTenant = async () => {
    "use server";
    await deleteTenant(tenant.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: "Clientes", href: "/admin/tenants" },
            { label: tenant.name },
          ]}
        />
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
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
          <div className="flex gap-2">
            <Link href={`/admin/tenants/${tenant.slug}/edit`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <form action={deleteThisTenant}>
              <DeleteButton
                message={`Excluir cliente "${tenant.name}"? Isso remove ${agentCount} agente(s) e ${userCount} vínculo(s) de usuário. Esta ação não pode ser desfeita.`}
              />
            </form>
          </div>
        </div>
      </div>

      <section className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            Agentes ({agentCount})
          </h2>
          <Link
            href={`/admin/agents/new?tenant=${tenant.slug}`}
            className="text-xs text-primary hover:underline"
          >
            + Novo agente neste cliente
          </Link>
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
              <tr key={a.id} className="border-t hover:bg-muted/30">
                <td className="px-5 py-2.5 font-medium">
                  <Link
                    href={`/admin/agents/${a.agentId}`}
                    className="hover:underline"
                  >
                    {a.name}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-muted-foreground">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {a.agentId}
                  </code>
                </td>
                <td className="px-5 py-2.5">
                  <StatusPill status={effectiveStatus(a)} />
                </td>
                <td className="px-5 py-2.5 text-muted-foreground">
                  {a.model ?? "—"}
                </td>
              </tr>
            ))}
            {agentCount === 0 && (
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
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            Usuários ({userCount})
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
                <td className="px-5 py-2.5 font-medium">
                  <Link
                    href={`/admin/users/${m.user.id}`}
                    className="hover:underline"
                  >
                    {m.user.name}
                  </Link>
                </td>
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
            {userCount === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-8 text-center text-sm text-muted-foreground"
                >
                  Nenhum usuário vinculado. Adicione em{" "}
                  <Link href="/admin/users" className="text-primary hover:underline">
                    Usuários
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

