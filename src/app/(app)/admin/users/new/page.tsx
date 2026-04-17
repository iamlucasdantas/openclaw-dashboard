import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/form";
import { CreateUserForm } from "../user-form";

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>
      <PageHeader
        title="Novo usuário"
        description="Crie uma conta com acesso ao painel. Você pode vincular a tenants depois."
      />
      <CreateUserForm />
    </div>
  );
}
