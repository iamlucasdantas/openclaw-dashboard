import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { ActiveRole } from "@/lib/active-role";
import { RoleSwitcher } from "./role-switcher";

export function Header({
  user,
  activeRole,
  availableRoles,
}: {
  user: { name: string; email: string };
  activeRole: ActiveRole;
  availableRoles: ActiveRole[];
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div>
        <h2 className="text-sm font-semibold">
          {activeRole === "admin"
            ? "Painel Administrativo"
            : "Painel do Cliente"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {activeRole === "admin"
            ? "Visão consolidada de todos os clientes e agentes."
            : "Apenas seus agentes e recursos."}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <RoleSwitcher activeRole={activeRole} availableRoles={availableRoles} />

        <div className="hidden flex-col items-end sm:flex">
          <span className="text-sm font-medium leading-tight">{user.name}</span>
          <span className="text-xs text-muted-foreground leading-tight">
            {user.email}
          </span>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            title="Sair"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
