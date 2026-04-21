import { cookies } from "next/headers";

export type ActiveRole = "admin" | "client";
export const ACTIVE_ROLE_COOKIE = "openclaw_active_role";

export async function getActiveRole(opts: {
  isAdmin: boolean;
  hasTenants: boolean;
}): Promise<ActiveRole> {
  const jar = await cookies();
  const raw = jar.get(ACTIVE_ROLE_COOKIE)?.value as ActiveRole | undefined;

  // Resolve conforme as roles disponíveis do usuário.
  if (raw === "admin" && opts.isAdmin) return "admin";
  if (raw === "client" && opts.hasTenants) return "client";

  if (opts.isAdmin) return "admin";
  if (opts.hasTenants) return "client";
  return "client";
}

export function availableRoles(opts: {
  isAdmin: boolean;
  hasTenants: boolean;
}): ActiveRole[] {
  const roles: ActiveRole[] = [];
  if (opts.isAdmin) roles.push("admin");
  if (opts.hasTenants) roles.push("client");
  return roles;
}
