import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      memberships: { include: { tenant: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Usuários do painel, com suas roles e tenants vinculados."
        actions={
          <Link href="/admin/users/new">
            <Button>
              <Plus className="h-4 w-4" />
              Novo usuário
            </Button>
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 text-left">Nome</th>
              <th className="px-5 py-2.5 text-left">Email</th>
              <th className="px-5 py-2.5 text-left">Papéis</th>
              <th className="px-5 py-2.5 text-left">Clientes</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="hover:underline"
                  >
                    {u.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-5 py-3">
                  {u.isAdmin && (
                    <span className="mr-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      admin
                    </span>
                  )}
                  {u.memberships.length > 0 && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      cliente
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {u.memberships.map((m) => m.tenant.name).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
