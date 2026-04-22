import Link from "next/link";
import { TaskItem, type TaskForDisplay } from "@/components/task-item";
import { cn } from "@/lib/utils";

type Range = "today" | "7d" | "30d";

type Props = {
  range: Range;
  basePath: string;
  tasks: TaskForDisplay[];
  agentHrefPrefix: "/admin/agents" | "/client/agents";
};

const LABELS: Record<Range, string> = {
  today: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
};

export function TabTasks({ range, basePath, tasks, agentHrefPrefix }: Props) {
  const filters: Range[] = ["today", "7d", "30d"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Período</span>
          <div className="inline-flex items-center rounded-lg border border-border bg-secondary p-0.5">
            {filters.map((r) => {
              const active = r === range;
              const href = r === "today" ? basePath : `${basePath}&range=${r}`;
              return (
                <Link
                  key={r}
                  href={href.includes("?") ? href : `${basePath}?range=${r}`}
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
          {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
        </p>
      </div>

      <section>
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhuma tarefa neste período.
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} agentHrefPrefix={agentHrefPrefix} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
