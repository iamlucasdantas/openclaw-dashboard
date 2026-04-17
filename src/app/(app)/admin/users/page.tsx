import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      memberships: { include: { tenant: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Usuários do painel, com suas roles e tenants vinculados.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
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
              <tr key={u.id} className="border-t">
                <td className="px-5 py-3 font-medium">{u.name}</td>
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
