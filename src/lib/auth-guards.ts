import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!session.user.isAdmin) {
    throw new Error("Acesso negado: rota restrita a administradores.");
  }
  return session;
}

export async function requireTenantAccess(tenantId: string) {
  const session = await requireSession();
  if (session.user.isAdmin) return session;
  if (!(session.user.tenantIds ?? []).includes(tenantId)) {
    throw new Error("Acesso negado: tenant fora do seu escopo.");
  }
  return session;
}
