import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { PasswordForm, ProfileForm } from "./profile-forms";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu perfil"
        description="Atualize seus dados pessoais e senha."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Dados</h2>
          </div>
          <div className="p-5">
            <ProfileForm initial={{ name: user.name, email: user.email }} />
          </div>
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Trocar senha</h2>
          </div>
          <div className="p-5">
            <PasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}
