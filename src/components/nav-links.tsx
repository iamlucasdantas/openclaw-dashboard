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
  Sparkles,
  Users,
  UserCog,
} from "lucide-react";
import type { ActiveRole } from "@/lib/active-role";
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
    { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
    { href: "/admin/tenants", label: "Clientes", icon: Building2 },
    { href: "/admin/agents", label: "Agentes", icon: Bot },
    { href: "/admin/github", label: "GitHub", icon: Github },
    { href: "/admin/skills", label: "Habilidades", icon: Sparkles },
    { href: "/admin/crons", label: "Agendamentos", icon: CalendarDays },
    { href: "/admin/costs", label: "Custos", icon: DollarSign },
    { href: "/admin/users", label: "Usuários", icon: Users },
    { href: "/admin/invites", label: "Convites", icon: Mail },
    { href: "/admin/audit", label: "Auditoria", icon: History },
  ];

  const clientNav = [
    { href: "/client", label: "Visão geral", icon: LayoutDashboard },
    { href: "/client/agents", label: "Meus agentes", icon: Bot },
    { href: "/client/crons", label: "Agendamentos", icon: CalendarDays },
    { href: "/client/costs", label: "Custos", icon: DollarSign },
    { href: "/client/profile", label: "Meu perfil", icon: UserCog },
  ];

  const nav = activeRole === "admin" ? adminNav : clientNav;

  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
