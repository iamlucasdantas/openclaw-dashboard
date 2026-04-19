import Link from "next/link";
import { copy, t } from "@/lib/copy";
import { StatusPill } from "@/components/status-pill";
import type { AssistantCard } from "@/lib/home-queries";

export function MyAssistantsGrid({ items }: { items: AssistantCard[] }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">
        {copy.home.sections.myAssistants}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <Link
            key={a.id}
            href={`/client/agents/${a.agentId}`}
            className="group rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span aria-hidden>🤖</span>
                  <span className="truncate font-medium">{a.name}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {a.tenantName}
                </p>
              </div>
              <StatusPill status={a.status} scope="client" />
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              {a.skillsCount === 1
                ? copy.home.assistantCard.skillsOne
                : t(copy.home.assistantCard.skillsMany, { n: a.skillsCount })}
              {" · "}
              {a.tasksToday === 0
                ? copy.home.assistantCard.tasksTodayZero
                : a.tasksToday === 1
                  ? copy.home.assistantCard.tasksTodayOne
                  : t(copy.home.assistantCard.tasksTodayMany, {
                      n: a.tasksToday,
                    })}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
