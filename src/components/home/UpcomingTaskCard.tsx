import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { copy, t } from "@/lib/copy";
import type { NextTask } from "@/lib/home-queries";
import { formatClock, formatDayLabel } from "@/lib/schedule";

export function UpcomingTaskCard({ next }: { next: NextTask | null }) {
  return (
    <section className="flex h-full flex-col rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-semibold">
          {copy.home.sections.upcomingTitle}
        </h2>
      </div>

      {next ? (
        <div className="mt-3 flex flex-1 flex-col">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t(copy.home.sections.upcomingLineWhen, {
              day: formatDayLabel(next.when),
              time: formatClock(next.when),
            })}
          </p>
          <p className="mt-1 text-sm">
            <span className="font-medium">{next.agent.name}</span>{" "}
            {next.name.toLowerCase()}
          </p>

          <Link
            href="/client/crons"
            className="mt-auto pt-3 text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copy.home.sections.seeSchedule}
          </Link>
        </div>
      ) : (
        <div className="mt-3 flex flex-1 flex-col">
          <p className="text-sm text-muted-foreground">
            {copy.home.sections.upcomingEmpty}
          </p>
          <Link
            href="/client/crons"
            className="mt-auto pt-3 text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Agendar tarefa →
          </Link>
        </div>
      )}
    </section>
  );
}
