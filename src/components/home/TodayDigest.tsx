import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertTriangle, Moon } from "lucide-react";
import { copy, t } from "@/lib/copy";
import type { TodayEntry, TodayGroup } from "@/lib/home-queries";

export function TodayDigest({ entries }: { entries: TodayEntry[] }) {
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });

  const hasAny = entries.some((e) => e.groups.length > 0);

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          {t(copy.home.sections.today, { date: today })}
        </h2>
      </div>
      <div className="divide-y">
        {entries.length === 0 ? (
          <EmptyRow text={copy.home.sections.todayEmpty} />
        ) : !hasAny ? (
          <EmptyRow text={copy.home.sections.todayEmpty} />
        ) : (
          entries.map((e) => <AgentDayRow key={e.agent.id} entry={e} />)
        )}
      </div>
    </section>
  );
}

function AgentDayRow({ entry }: { entry: TodayEntry }) {
  const isIdle = entry.groups.length === 0;
  return (
    <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-base">
            🤖
          </span>
          <span className="font-medium">{entry.agent.name}</span>
          <span className="text-xs text-muted-foreground">
            → {entry.agent.tenantName}
          </span>
        </div>

        <ul className="mt-2 space-y-1.5 pl-7 text-sm">
          {isIdle ? (
            <li className="flex items-center gap-2 text-muted-foreground">
              <Moon className="h-4 w-4" aria-hidden="true" />
              {copy.home.sections.todayAgentIdle}
            </li>
          ) : (
            entry.groups.map((g) => (
              <GroupLine key={g.skillSlug} group={g} />
            ))
          )}
        </ul>
      </div>

      <Link
        href={`/client/agents/${entry.agent.agentId}`}
        className="shrink-0 self-start text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copy.home.sections.openAgent}
      </Link>
    </div>
  );
}

function GroupLine({ group }: { group: TodayGroup }) {
  const verbs =
    (copy.home.activityVerbs as Record<string, { one: string; many: string }>)[
      group.skillSlug
    ] ?? copy.home.activityVerbs.generic;
  const tpl = group.count === 1 ? verbs.one : verbs.many;
  const text = t(tpl, { n: group.count });

  const Icon =
    group.worstStatus === "ok" ? CheckCircle2 : AlertTriangle;

  const iconCss =
    group.worstStatus === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : group.worstStatus === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  return (
    <li className="flex items-start gap-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconCss}`} aria-hidden="true" />
      <span>{text}</span>
      {group.hasIssue ? (
        <span className="text-xs text-muted-foreground">
          ({copy.home.sections.viewIssue}{" "}
          <ArrowRight className="inline h-3 w-3" aria-hidden="true" />)
        </span>
      ) : null}
    </li>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
      <Moon className="h-4 w-4" aria-hidden="true" />
      {text}
    </div>
  );
}
