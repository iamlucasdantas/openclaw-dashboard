import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { TenantForm } from "../../tenant-form";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

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
    </div>
  );
}
