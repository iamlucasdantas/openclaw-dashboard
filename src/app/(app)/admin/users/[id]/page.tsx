import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatDate } from "@/lib/utils";
import { Button, Select } from "@/components/form";
import { DeleteButton } from "@/components/delete-button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EditUserForm, SetPasswordForm } from "../user-form";
import { RemoveMembershipButton } from "../memberships";
import { addMembership, deleteUser } from "@/app/actions/users";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isSelf = session?.user.id === id;

  const [user, allTenants] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        memberships: { include: { tenant: true } },
      },
    }),
    prisma.tenant.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) notFound();

  const memberTenantIds = new Set(user.memberships.map((m) => m.tenantId));
  const availableTenants = allTenants.filter((t) => !memberTenantIds.has(t.id));

  const deleteThisUser = async () => {
    "use server";
    await deleteUser(user.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: "Usuários", href: "/admin/users" },
            { label: user.name },
          ]}
        />
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.email} · criado em {formatDate(user.createdAt)}
            </p>
          </div>
          {!isSelf && (
            <form action={deleteThisUser}>
              <DeleteButton
                message={`Excluir usuário "${user.name}"? Ele perderá acesso ao painel.`}
              />
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Dados</h2>
          </div>
          <div className="p-5">
            <EditUserForm
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
              }}
              isSelf={isSelf}
            />
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Redefinir senha</h2>
          </div>
          <div className="p-5">
            <SetPasswordForm userId={user.id} />
          </div>
        </section>
      </div>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            Clientes vinculados ({user.memberships.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Cada vínculo habilita a role <strong>cliente</strong> para o tenant.
          </p>
        </div>
        <ul className="divide-y">
          {user.memberships.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <div>
                <Link
                  href={`/admin/tenants/${m.tenant.slug}`}
                  className="font-medium hover:underline"
                >
                  {m.tenant.name}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">
                  {m.tenant.slug}
                </span>
              </div>
              <RemoveMembershipButton
                userId={user.id}
                tenantId={m.tenantId}
                tenantName={m.tenant.name}
              />
            </li>
          ))}
          {user.memberships.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-muted-foreground">
              Nenhum vínculo ainda.
            </li>
          )}
        </ul>

        {availableTenants.length > 0 && (
          <form action={addMembership} className="flex gap-2 border-t p-4">
            <input type="hidden" name="userId" value={user.id} />
            <Select name="tenantId" required defaultValue="">
              <option value="" disabled>
                Adicionar vínculo...
              </option>
              {availableTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Vincular
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
