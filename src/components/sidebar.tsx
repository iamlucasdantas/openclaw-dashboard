import type { ActiveRole } from "@/lib/active-role";
import { NavLinks } from "./nav-links";

export function Sidebar({ activeRole }: { activeRole: ActiveRole }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-xs font-bold">OC</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">OpenClaw</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {activeRole === "admin" ? "Admin" : "Cliente"}
          </div>
        </div>
      </div>
      <div className="flex-1 p-3">
        <NavLinks activeRole={activeRole} />
      </div>
      <div className="border-t p-3 text-[11px] text-muted-foreground">
        v0.1 · painel multi-tenant
      </div>
    </aside>
  );
}
