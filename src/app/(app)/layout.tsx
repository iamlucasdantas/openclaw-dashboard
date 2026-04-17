import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { availableRoles, getActiveRole } from "@/lib/active-role";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.isAdmin;
  const hasTenants = (session.user.tenantIds ?? []).length > 0;
  const roles = availableRoles({ isAdmin, hasTenants });
  const activeRole = await getActiveRole({ isAdmin, hasTenants });

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar activeRole={activeRole} />
      <div className="flex flex-1 flex-col">
        <Header
          user={{ name: session.user.name ?? "", email: session.user.email ?? "" }}
          activeRole={activeRole}
          availableRoles={roles}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
