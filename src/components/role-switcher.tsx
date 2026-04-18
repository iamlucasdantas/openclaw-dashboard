"use client";

import { useTransition } from "react";
import { Shield, User as UserIcon } from "lucide-react";
import type { ActiveRole } from "@/lib/active-role";
import { switchRole } from "@/app/actions/role";
import { cn } from "@/lib/utils";

export function RoleSwitcher({
  activeRole,
  availableRoles,
}: {
  activeRole: ActiveRole;
  availableRoles: ActiveRole[];
}) {
  const [pending, startTransition] = useTransition();

  // Se só tem uma role, mostra um badge informativo sem toggle.
  if (availableRoles.length < 2) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground">
        {activeRole === "admin" ? (
          <Shield className="h-3 w-3" />
        ) : (
          <UserIcon className="h-3 w-3" />
        )}
        {activeRole === "admin" ? "Admin" : "Cliente"}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5 text-xs shadow-sm">
      {availableRoles.map((role) => {
        const isActive = role === activeRole;
        const Icon = role === "admin" ? Shield : UserIcon;
        return (
          <button
            key={role}
            type="button"
            disabled={pending || isActive}
            onClick={() =>
              startTransition(() => {
                void switchRole(role);
              })
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-medium transition",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              pending && "opacity-60"
            )}
          >
            <Icon className="h-3 w-3" />
            {role === "admin" ? "Admin" : "Cliente"}
          </button>
        );
      })}
    </div>
  );
}
