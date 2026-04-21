"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Mapa de rótulos por segmento. Para segmentos que não existem aqui
// (IDs, slugs), mostramos a raw string — o detalhe da página continua
// sendo quem exibe o nome humano no H1.
const LABELS: Record<string, string> = {
  admin: "Admin",
  client: "Cliente",
  agents: "Agentes",
  tenants: "Clientes",
  skills: "Habilidades",
  crons: "Agendamentos",
  schedules: "Agendamentos",
  costs: "Custos",
  github: "GitHub",
  integrations: "Integrações",
  prospecting: "Prospecção",
  invites: "Convites",
  audit: "Auditoria",
  users: "Usuários",
  profile: "Meu perfil",
  mapping: "Mapeamento",
  schedule: "Agendar",
  new: "Novo",
  edit: "Editar",
};

export function HeaderTrail() {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);

  // Não renderiza nada em rotas vazias ou públicas
  if (segments.length === 0) return null;

  // Root (/admin ou /client)
  const root = segments[0];
  const rootLabel = LABELS[root] ?? root;
  const rootHref = `/${root}`;

  const trail: { label: string; href?: string }[] = [
    { label: rootLabel, href: rootHref },
    ...segments.slice(1).map((seg, i) => {
      const href = "/" + segments.slice(0, i + 2).join("/");
      const label = LABELS[seg] ?? seg;
      const isLast = i + 2 === segments.length;
      return { label, href: isLast ? undefined : href };
    }),
  ];

  return (
    <nav
      aria-label="Navegação"
      className="flex min-w-0 items-center gap-1 text-[13px]"
    >
      <Link
        href={rootHref}
        className="shrink-0 text-muted-foreground transition hover:text-foreground"
        aria-label="Início"
      >
        <Home className="h-3.5 w-3.5" aria-hidden />
      </Link>
      {trail.map((c, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1">
          <ChevronRight
            className="h-3 w-3 shrink-0 text-muted-foreground/50"
            aria-hidden
          />
          {c.href ? (
            <Link
              href={c.href}
              className="truncate text-muted-foreground transition hover:text-foreground hover:underline"
            >
              {c.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-foreground">
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
