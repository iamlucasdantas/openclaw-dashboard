import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Button, PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { TableFilters } from "@/components/table-filters";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const all = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { agents: true, memberships: true } },
    },
  });
  const tenants = q
    ? all.filter((t) =>
        `${t.name} ${t.slug} ${t.description ?? ""}`.toLowerCase().includes(q)
      )
    : all;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Todos os tenants da infraestrutura, com contagem de agentes e usuários."
        actions={
          <Link href="/admin/tenants/new">
            <Button>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </Link>
        }
      />

      <TableFilters placeholder="Buscar por nome, slug ou descrição..." />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 text-left">Cliente</th>
              <th className="px-5 py-2.5 text-left">Slug</th>
              <th className="px-5 py-2.5 text-right">Agentes</th>
              <th className="px-5 py-2.5 text-right">Usuários</th>
              <th className="px-5 py-2.5 text-left">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t hover:bg-muted/30">
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/tenants/${t.slug}`}
                    className="font-medium hover:underline"
                  >
                    {t.name}
                  </Link>
                  {t.description ? (
                    <div className="text-xs text-muted-foreground">
                      {t.description}
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {t.slug}
                  </code>
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {t._count.agents}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {t._count.memberships}
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {formatDate(t.createdAt)}
                </td>
              </tr>
            ))}
            {tenants.length === 0 && all.length > 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Nenhum cliente bate com essa busca.
                </td>
              </tr>
            )}
            {all.length === 0 && (
              <EmptyState
                colSpan={5}
                icon={<Building2 className="h-5 w-5" />}
                title="Nenhum cliente cadastrado"
                description="Cadastre o primeiro cliente para começar a registrar agentes."
                action={{ label: "Novo cliente", href: "/admin/tenants/new" }}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
