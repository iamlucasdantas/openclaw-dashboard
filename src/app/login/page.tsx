import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">OC</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            OpenClaw Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Painel multi-tenant de agentes
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
