"use client";

import { Clock } from "lucide-react";
import { copy, t } from "@/lib/copy";
import { formatClock, formatDayLabel, humanizeSchedule, nextRunsFor } from "@/lib/schedule";

export function SchedulePreview({ schedule }: { schedule: string }) {
  const human = humanizeSchedule(schedule);
  const upcoming = nextRunsFor(schedule, 3);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {copy.schedule.wizard.preview.title}
      </p>
      <p className="mt-1 text-sm font-medium">
        {t(copy.schedule.wizard.preview.natural, { humanSchedule: human })}
      </p>
      {upcoming.length > 0 ? (
        <div className="mt-2">
          <p className="text-[11px] text-muted-foreground">
            {copy.schedule.wizard.preview.nextRuns}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {upcoming.map((d, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-[11px] tabular-nums border"
              >
                <Clock className="h-3 w-3" aria-hidden />
                {formatDayLabel(d)} · {formatClock(d)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
