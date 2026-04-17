import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { agents: true, memberships: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Todos os tenants da infraestrutura, com contagem de agentes e
            usuários.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
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
            {tenants.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum tenant cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
