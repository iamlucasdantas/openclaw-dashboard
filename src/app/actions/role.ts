"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ACTIVE_ROLE_COOKIE, type ActiveRole } from "@/lib/active-role";
import { auth } from "@/auth";

export async function switchRole(nextRole: ActiveRole) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.isAdmin;
  const hasTenants = (session.user.tenantIds ?? []).length > 0;

  if (nextRole === "admin" && !isAdmin) return;
  if (nextRole === "client" && !hasTenants) return;

  const jar = await cookies();
  jar.set(ACTIVE_ROLE_COOKIE, nextRole, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/", "layout");
  redirect(nextRole === "admin" ? "/admin" : "/client");
}
