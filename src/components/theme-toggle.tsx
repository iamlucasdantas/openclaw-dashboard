"use client";

import { useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { setTheme } from "@/app/actions/theme";

export function ThemeToggle({ theme }: { theme: Theme }) {
  const [pending, startTransition] = useTransition();
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      title={`Mudar para tema ${next === "dark" ? "escuro" : "claro"}`}
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          void setTheme(next);
        })
      }
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
