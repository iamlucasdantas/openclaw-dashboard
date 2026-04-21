"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Building2,
  CalendarDays,
  Command,
  Compass,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  type: "nav" | "agent" | "tenant" | "skill" | "cron" | "campaign";
  label: string;
  href: string;
  hint?: string;
};

const TYPE_META: Record<
  Item["type"],
  { group: string; Icon: any; order: number }
> = {
  nav: { group: "Navegar para", Icon: Compass, order: 0 },
  agent: { group: "Assistentes", Icon: Bot, order: 1 },
  tenant: { group: "Clientes", Icon: Building2, order: 2 },
  campaign: { group: "Campanhas de prospecção", Icon: Target, order: 3 },
  skill: { group: "Habilidades", Icon: Sparkles, order: 4 },
  cron: { group: "Agendamentos", Icon: CalendarDays, order: 5 },
};

type PaletteData = {
  agents: Item[];
  tenants: Item[];
  skills: Item[];
  crons: Item[];
  campaigns: Item[];
  navigation: Item[];
};

function fuzzy(haystack: string, needle: string): number {
  // score simples: hit exato > prefixo > substring > rank por distância
  if (!needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h === n) return 1000;
  if (h.startsWith(n)) return 500 - (h.length - n.length);
  const idx = h.indexOf(n);
  if (idx >= 0) return 200 - idx;
  // tolerância mínima: ordena caracteres do query
  let j = 0;
  for (let i = 0; i < h.length && j < n.length; i++) {
    if (h[i] === n[j]) j++;
  }
  return j === n.length ? 50 : -1;
}

export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "/" && !open) {
        const target = e.target as HTMLElement;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Buscar (Ctrl+K)"
        className="hidden h-9 items-center gap-2 rounded-md border bg-background px-3 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
      >
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span>Buscar</span>
        <span className="ml-2 hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] md:inline-flex">
          <Command className="h-3 w-3" aria-hidden />K
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-accent hover:text-accent-foreground sm:hidden"
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>

      {open ? <PaletteDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<PaletteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetch("/api/search")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const allItems: Item[] = useMemo(() => {
    if (!data) return [];
    return [
      ...data.navigation,
      ...data.agents,
      ...data.tenants,
      ...data.campaigns,
      ...data.skills,
      ...data.crons,
    ];
  }, [data]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Sem query: mostra só navegação + top N de cada tipo
      return [
        ...(data?.navigation ?? []),
        ...(data?.agents ?? []).slice(0, 5),
        ...(data?.tenants ?? []).slice(0, 5),
        ...(data?.campaigns ?? []).slice(0, 3),
      ];
    }
    const scored = allItems
      .map((i) => {
        const a = fuzzy(i.label, query);
        const b = i.hint ? fuzzy(i.hint, query) : -1;
        return { item: i, score: Math.max(a, b) };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 30).map((x) => x.item);
  }, [query, allItems, data]);

  // Agrupa por tipo, preservando ordem de `order`
  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = {};
    for (const it of filtered) {
      const k = TYPE_META[it.type].group;
      (g[k] ||= []).push(it);
    }
    return Object.entries(g).sort((a, b) => {
      const oa = TYPE_META[
        filtered.find((i) => TYPE_META[i.type].group === a[0])!.type
      ].order;
      const ob = TYPE_META[
        filtered.find((i) => TYPE_META[i.type].group === b[0])!.type
      ].order;
      return oa - ob;
    });
  }, [filtered]);

  function go(item: Item) {
    onClose();
    router.push(item.href);
  }

  useEffect(() => {
    setCursor(0);
  }, [query]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(filtered.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[cursor];
      if (it) go(it);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-xl border bg-card shadow-2xl"
        onKeyDown={onKey}
      >
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar assistente, cliente, habilidade, agendamento…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Carregando...
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nada encontrado. Tente outro termo.
            </p>
          ) : (
            grouped.map(([group, items]) => (
              <section key={group}>
                <div className="bg-muted/30 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                <ul>
                  {items.map((it) => {
                    const i = filtered.indexOf(it);
                    const active = i === cursor;
                    const Icon = TYPE_META[it.type].Icon;
                    return (
                      <li key={`${it.type}-${it.href}`}>
                        <button
                          type="button"
                          onClick={() => go(it)}
                          onMouseEnter={() => setCursor(i)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition",
                            active ? "bg-accent text-accent-foreground" : ""
                          )}
                        >
                          <Icon
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <span className="flex-1 truncate">{it.label}</span>
                          {it.hint ? (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {it.hint}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <kbd className="rounded border bg-background px-1">↑</kbd>
            <kbd className="rounded border bg-background px-1">↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1">enter</kbd>
            abrir
          </span>
        </div>
      </div>
    </div>
  );
}
