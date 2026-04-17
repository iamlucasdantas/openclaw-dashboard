import Link from "next/link";
import { headers } from "next/headers";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Button, PageHeader } from "@/components/form";
import { RevokeInviteButton } from "./revoke-button";
import { CopyLinkButton } from "./copy-link-button";

export default async function InvitesPage() {
  const [invites, h] = await Promise.all([
    prisma.invite.findMany({
      include: { tenant: true, creator: true },
      orderBy: { createdAt: "desc" },
    }),
    headers(),
  ]);

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  const now = Date.now();
  const statusOf = (i: (typeof invites)[number]) => {
    if (i.acceptedAt) return "aceito";
    if (i.expiresAt.getTime() < now) return "expirado";
    return "pendente";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Convites"
        description="Convites para criar conta no painel. Como não há SMTP, copie o link e envie manualmente."
        actions={
          <Link href="/admin/invites/new">
            <Button>
              <Plus className="h-4 w-4" />
              Novo convite
            </Button>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 text-left">Email</th>
              <th className="px-5 py-2.5 text-left">Papéis</th>
              <th className="px-5 py-2.5 text-left">Cliente</th>
              <th className="px-5 py-2.5 text-left">Status</th>
              <th className="px-5 py-2.5 text-left">Expira</th>
              <th className="px-5 py-2.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => {
              const st = statusOf(i);
              const link = `${origin}/invite/${i.token}`;
              return (
                <tr key={i.id} className="border-t align-top">
                  <td className="px-5 py-3 font-medium">{i.email}</td>
                  <td className="px-5 py-3">
                    {i.isAdmin && (
                      <span className="mr-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        admin
                      </span>
                    )}
                    {i.tenantId && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        cliente
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {i.tenant?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={st} />
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      por {i.creator.name} · {formatDate(i.createdAt)}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {i.acceptedAt
                      ? `aceito em ${formatDate(i.acceptedAt)}`
                      : formatDate(i.expiresAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {st === "pendente" ? (
                        <>
                          <CopyLinkButton link={link} />
                          <RevokeInviteButton id={i.id} email={i.email} />
                        </>
                      ) : (
                        <RevokeInviteButton id={i.id} email={i.email} label="Remover" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {invites.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum convite emitido ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pendente: "bg-amber-50 text-amber-700",
    aceito: "bg-emerald-50 text-emerald-700",
    expirado: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}
    >
      {status}
    </span>
  );
}
