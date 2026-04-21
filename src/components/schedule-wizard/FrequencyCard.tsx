"use client";

import { cn } from "@/lib/utils";

export type FrequencyKey =
  | "minutes"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "advanced";

export function FrequencyCard({
  freq,
  label,
  emoji,
  description,
  active,
  onSelect,
}: {
  freq: FrequencyKey;
  label: string;
  emoji: string;
  description: string;
  active: boolean;
  onSelect: (f: FrequencyKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(freq)}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:border-muted-foreground/40 hover:bg-accent/40"
      )}
    >
      <span aria-hidden className="text-xl">
        {emoji}
      </span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}
