import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { DangerZone } from "@/components/danger-zone";
import { TypeToConfirmButton } from "@/components/type-to-confirm";
import { TenantForm } from "../../tenant-form";
import { deleteTenant } from "@/app/actions/tenants";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      _count: { select: { agents: true, memberships: true } },
    },
  });
  if (!tenant) notFound();

  const deleteThisTenant = async () => {
    "use server";
    await deleteTenant(tenant.id);
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/tenants/${tenant.slug}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>
      <PageHeader
        title={`Editar ${tenant.name}`}
        description="Atualiza informações do cliente."
      />
      <TenantForm
        mode="edit"
        initial={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          description: tenant.description,
        }}
      />

      <DangerZone
        title={`Excluir o cliente "${tenant.name}"`}
        description="A exclusão dispara cascata em todos os recursos do cliente. Não tem como desfazer."
      >
        <TypeToConfirmButton
          action={deleteThisTenant}
          confirmText={tenant.name}
          triggerLabel="Excluir cliente"
          title={`Excluir o cliente "${tenant.name}"?`}
          description="Esta ação é permanente. Todos os recursos do cliente serão apagados em cascata."
          impactLines={[
            `Apagar ${tenant._count.agents} agente(s)`,
            `Remover ${tenant._count.memberships} vínculo(s) de usuário`,
            "Apagar tarefas agendadas, habilidades e histórico",
          ]}
          ctaLabel={`Excluir ${tenant.name}`}
        />
      </DangerZone>
    </div>
  );
}
