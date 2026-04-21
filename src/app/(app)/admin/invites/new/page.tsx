import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { InviteForm } from "./invite-form";

export default async function NewInvitePage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/invites"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>
      <PageHeader
        title="Novo convite"
        description="Gera um link que permite criar conta sem SMTP. Copie e envie por fora."
      />
      <InviteForm tenants={tenants} />
    </div>
  );
}
