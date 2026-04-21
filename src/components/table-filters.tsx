"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Busca textual + dropdowns de filtro por URL (?q=, ?tenant=, ?state=).
// Funciona em conjunto com o SSR: o server lê os params e filtra.
export function TableFilters({
  placeholder = "Buscar...",
  filters = [],
}: {
  placeholder?: string;
  filters?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(Array.from(params.entries()));
      if (q.trim()) sp.set("q", q.trim());
      else sp.delete("q");
      router.replace(`${pathname}?${sp.toString()}`);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setFilter(key: string, value: string) {
    const sp = new URLSearchParams(Array.from(params.entries()));
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.replace(`${pathname}?${sp.toString()}`);
  }

  const hasActive =
    !!q || filters.some((f) => (params.get(f.key) ?? "") !== "");

  function clearAll() {
    setQ("");
    const sp = new URLSearchParams();
    router.replace(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px] max-w-md">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Limpar busca"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {filters.map((f) => {
        const value = params.get(f.key) ?? "";
        return (
          <select
            key={f.key}
            value={value}
            onChange={(e) => setFilter(f.key, e.target.value)}
            className={cn(
              "h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring",
              value && "border-primary"
            )}
          >
            <option value="">{f.label}: todos</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      })}

      {hasActive ? (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Limpar
        </button>
      ) : null}
    </div>
  );
}
