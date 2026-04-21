"use client";

import { useTransition } from "react";
import { CalendarDays, CalendarRange, List } from "lucide-react";
import { setCronView, type CronView } from "@/app/actions/view-mode";
import { cn } from "@/lib/utils";

export function CronViewToggle({
  current,
  pathname,
}: {
  current: CronView;
  pathname: string;
}) {
  const [pending, startTransition] = useTransition();

  function switchTo(m: CronView) {
    if (m === current || pending) return;
    startTransition(() => {
      void setCronView(m, pathname);
    });
  }

  const btn = (mode: CronView, label: string, Icon: any) => (
    <button
      type="button"
      disabled={pending}
      onClick={() => switchTo(mode)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition",
        current === mode
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        pending && "opacity-60"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5 shadow-sm">
      {btn("calendar", "Calendário", CalendarRange)}
      {btn("agenda", "Agenda", CalendarDays)}
      {btn("list", "Lista", List)}
    </div>
  );
}
