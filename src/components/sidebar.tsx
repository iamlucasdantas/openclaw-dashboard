import Link from "next/link";
import {
  Building2,
  Bot,
  Clock,
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

export function Sidebar({ activeRole }: { activeRole: ActiveRole }) {
  const adminNav = [
    { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
    { href: "/admin/tenants", label: "Clientes", icon: Building2 },
    { href: "/admin/agents", label: "Agentes", icon: Bot },
    { href: "/admin/github", label: "GitHub", icon: Github },
    { href: "/admin/skills", label: "Skills", icon: Sparkles },
    { href: "/admin/crons", label: "Crons", icon: Clock },
    { href: "/admin/costs", label: "Custos", icon: DollarSign },
    { href: "/admin/users", label: "Usuários", icon: Users },
    { href: "/admin/invites", label: "Convites", icon: Mail },
    { href: "/admin/audit", label: "Auditoria", icon: History },
  ];

  const clientNav = [
    { href: "/client", label: "Visão geral", icon: LayoutDashboard },
    { href: "/client/agents", label: "Meus agentes", icon: Bot },
    { href: "/client/costs", label: "Custos", icon: DollarSign },
    { href: "/client/profile", label: "Meu perfil", icon: UserCog },
  ];

  const nav = activeRole === "admin" ? adminNav : clientNav;

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
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
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3 text-[11px] text-muted-foreground">
        v0.1 · painel multi-tenant
      </div>
    </aside>
  );
}
