"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Bot,
  CalendarDays,
  DollarSign,
  Github,
  History,
  LayoutDashboard,
  Mail,
  Plug,
  Sparkles,
  Users,
  UserCog,
} from "lucide-react";
import type { ActiveRole } from "@/lib/active-role";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

export function NavLinks({
  activeRole,
  onNavigate,
}: {
  activeRole: ActiveRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const adminNav = [
    { href: "/admin", label: copy.nav.admin.overview, icon: LayoutDashboard },
    { href: "/admin/tenants", label: copy.nav.admin.tenants, icon: Building2 },
    { href: "/admin/agents", label: copy.nav.admin.agents, icon: Bot },
    { href: "/admin/integrations", label: copy.nav.admin.integrations, icon: Plug },
    { href: "/admin/github", label: copy.nav.admin.github, icon: Github },
    { href: "/admin/skills", label: copy.nav.admin.skills, icon: Sparkles },
    { href: "/admin/crons", label: copy.nav.admin.crons, icon: CalendarDays },
    { href: "/admin/costs", label: copy.nav.admin.costs, icon: DollarSign },
    { href: "/admin/users", label: copy.nav.admin.users, icon: Users },
    { href: "/admin/invites", label: copy.nav.admin.invites, icon: Mail },
    { href: "/admin/audit", label: copy.nav.admin.audit, icon: History },
  ];

  const clientNav = [
    { href: "/client", label: copy.nav.client.home, icon: LayoutDashboard },
    { href: "/client/agents", label: copy.nav.client.agents, icon: Bot },
    {
      href: "/client/integrations",
      label: copy.nav.client.integrations,
      icon: Plug,
    },
    { href: "/client/crons", label: copy.nav.client.schedule, icon: CalendarDays },
    { href: "/client/costs", label: copy.nav.client.costs, icon: DollarSign },
    { href: "/client/profile", label: copy.nav.client.profile, icon: UserCog },
  ];

  const nav = activeRole === "admin" ? adminNav : clientNav;

  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
