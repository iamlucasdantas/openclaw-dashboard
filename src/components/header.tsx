import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { ActiveRole } from "@/lib/active-role";
import type { Theme } from "@/lib/theme";
import { MobileNav } from "./mobile-nav";
import { RoleSwitcher } from "./role-switcher";
import { ThemeToggle } from "./theme-toggle";

export function Header({
  user,
  activeRole,
  availableRoles,
  theme,
}: {
  user: { name: string; email: string };
  activeRole: ActiveRole;
  availableRoles: ActiveRole[];
  theme: Theme;
}) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-card px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav activeRole={activeRole} />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">
            {activeRole === "admin"
              ? "Painel Administrativo"
              : "Painel do Cliente"}
          </h2>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {activeRole === "admin"
              ? "Visão consolidada de todos os clientes e agentes."
              : "Apenas seus agentes e recursos."}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <RoleSwitcher activeRole={activeRole} availableRoles={availableRoles} />
        <ThemeToggle theme={theme} />

        <div className="hidden flex-col items-end lg:flex">
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
