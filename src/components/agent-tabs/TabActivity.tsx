import Link from "next/link";
import { copy, t } from "@/lib/copy";
import { ActivityItem, type ActivityForDisplay } from "@/components/activity-item";
import { cn } from "@/lib/utils";

type Range = "today" | "7d" | "30d";

type Props = {
  range: Range;
  basePath: string;
  activities: ActivityForDisplay[];
  agentHrefPrefix: "/admin/agents" | "/client/agents";
};

const LABELS: Record<Range, string> = {
  today: copy.agent.detail.activity.filterToday,
  "7d": copy.agent.detail.activity.filter7,
  "30d": copy.agent.detail.activity.filter30,
};

export function TabActivity({
  range,
  basePath,
  activities,
  agentHrefPrefix,
}: Props) {
  const filters: Range[] = ["today", "7d", "30d"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {copy.agent.detail.activity.filtersLabel}
          </span>
          <div className="inline-flex items-center rounded-md border bg-background p-0.5">
            {filters.map((r) => {
              const active = r === range;
              const href = r === "today" ? basePath : `${basePath}&range=${r}`;
              return (
                <Link
                  key={r}
                  href={
                    href.includes("?")
                      ? href.replace("&range=", "&range=")
                      : `${basePath}?range=${r}`
                  }
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {LABELS[r]}
                </Link>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t(copy.agent.detail.activity.total, { n: activities.length })}
        </p>
      </div>

      <section className="rounded-lg border bg-card">
        <ul className="divide-y">
          {activities.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">
              {copy.agent.detail.activity.empty}
            </li>
          ) : (
            activities.map((a) => (
              <ActivityItem key={a.id} a={a} agentHrefPrefix={agentHrefPrefix} />
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
