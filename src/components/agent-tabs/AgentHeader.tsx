import Link from "next/link";
import { copy } from "@/lib/copy";
import { StatusPill } from "@/components/status-pill";
import type { EffectiveStatus } from "@/lib/agent-status";
import { cn } from "@/lib/utils";

export type TabKey = "summary" | "tasks" | "connections" | "dev";

const TABS: { key: TabKey; label: string; clientOnly?: boolean }[] = [
  { key: "tasks", label: "Tarefas" },
  { key: "summary", label: "Resumo" },
  { key: "connections", label: "Integrações" },
  { key: "dev", label: "Modo desenvolvedor" },
];

export function AgentHeader({
  agent,
  status,
  currentTab,
  basePath,
  scope,
}: {
  agent: { name: string; persona: string | null; tenantName: string; avatarUrl?: string | null };
  status: EffectiveStatus;
  currentTab: TabKey;
  basePath: string;
  scope: "client" | "admin";
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {agent.avatarUrl ? (
              <img
                src={agent.avatarUrl}
                alt={agent.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <span aria-hidden className="text-2xl">
                🤖
              </span>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">
              {agent.name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Assistente de {agent.tenantName}
          </p>
          {agent.persona ? (
            <p className="mt-2 max-w-2xl text-sm italic text-muted-foreground">
              “{agent.persona}”
            </p>
          ) : (
            <p className="mt-2 max-w-2xl text-sm italic text-muted-foreground/70">
              {copy.agent.personaFallback}
            </p>
          )}
        </div>
        <div className="shrink-0">
          <StatusPill status={status} scope={scope} showHint />
        </div>
      </div>

      <nav
        role="tablist"
        aria-label="Seções do assistente"
        className="-mx-4 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
      >
        <div className="flex min-w-max gap-1">
          {TABS.map((tab) => {
            const active = tab.key === currentTab;
            const href =
              tab.key === "tasks" ? `${basePath}?tab=tasks` : tab.key === "summary" ? basePath : `${basePath}?tab=${tab.key}`;
            return (
              <Link
                key={tab.key}
                href={href}
                role="tab"
                aria-selected={active}
                className={cn(
                  "relative rounded-t-md px-3 py-2 text-sm font-medium transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {active ? (
                  <span
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
