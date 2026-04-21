import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { AcceptInviteForm } from "./accept-form";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { tenant: true },
  });

  const expired = !!invite && invite.expiresAt.getTime() < Date.now();
  const accepted = !!invite?.acceptedAt;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">OC</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            OpenClaw Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Você foi convidado para acessar o painel.
          </p>
        </div>

        {!invite ? (
          <InviteError message="Convite não encontrado." />
        ) : expired ? (
          <InviteError
            message={`Este convite expirou em ${formatDate(invite.expiresAt)}. Peça um novo.`}
          />
        ) : accepted ? (
          <InviteError message="Este convite já foi usado." />
        ) : (
          <>
            <div className="mb-5 space-y-2 rounded-md border bg-muted/40 p-4 text-sm">
              <Row label="Email" value={invite.email} />
              <Row
                label="Papel"
                value={
                  [
                    invite.isAdmin ? "admin" : null,
                    invite.tenantId ? `cliente (${invite.tenant?.name})` : null,
                  ]
                    .filter(Boolean)
                    .join(" + ") || "—"
                }
              />
              <Row label="Expira em" value={formatDate(invite.expiresAt)} />
            </div>
            <AcceptInviteForm token={invite.token} email={invite.email} />
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}
