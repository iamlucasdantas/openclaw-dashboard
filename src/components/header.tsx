import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { ActiveRole } from "@/lib/active-role";
import type { Theme } from "@/lib/theme";
import { MobileNav } from "./mobile-nav";
import { RoleSwitcher } from "./role-switcher";
import { ThemeToggle } from "./theme-toggle";
import { HeaderTrail } from "./header-trail";
import { CommandPaletteTrigger } from "./command-palette";

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
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MobileNav activeRole={activeRole} />
        <HeaderTrail />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <CommandPaletteTrigger />
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
