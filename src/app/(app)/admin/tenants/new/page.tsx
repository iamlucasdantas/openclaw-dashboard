import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/form";
import { TenantForm } from "../tenant-form";

export default function NewTenantPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/tenants"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>
      <PageHeader
        title="Novo cliente"
        description="Cadastra um novo tenant na infraestrutura OpenClaw."
      />
      <TenantForm mode="create" />
    </div>
  );
}
