import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveRole } from "@/lib/active-role";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = await getActiveRole({
    isAdmin: session.user.isAdmin,
    hasTenants: (session.user.tenantIds ?? []).length > 0,
  });

  redirect(role === "admin" ? "/admin" : "/client");
}
