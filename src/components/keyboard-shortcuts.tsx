"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard, X } from "lucide-react";
import type { ActiveRole } from "@/lib/active-role";

type Shortcut = { keys: string[]; label: string };

function shortcutsFor(activeRole: ActiveRole): Shortcut[] {
  const prefix = activeRole === "admin" ? "/admin" : "/client";
  const common: Shortcut[] = [
    { keys: ["g", "h"], label: "Início" },
    { keys: ["g", "a"], label: "Assistentes" },
    { keys: ["g", "i"], label: "Integrações" },
    { keys: ["g", "p"], label: "Prospecção" },
    { keys: ["g", "c"], label: activeRole === "admin" ? "Agendamentos" : "Tarefas" },
    { keys: ["g", "x"], label: "Custos" },
  ];
  if (activeRole === "admin") {
    common.push({ keys: ["g", "t"], label: "Clientes" });
    common.push({ keys: ["g", "s"], label: "Habilidades" });
  }
  void prefix;
  return common;
}

function routesFor(activeRole: ActiveRole): Record<string, string> {
  const prefix = activeRole === "admin" ? "/admin" : "/client";
  const r: Record<string, string> = {
    h: prefix,
    a: `${prefix}/agents`,
    i: `${prefix}/integrations`,
    p: `${prefix}/prospecting`,
    c: `${prefix}/crons`,
    x: `${prefix}/costs`,
  };
  if (activeRole === "admin") {
    r.t = "/admin/tenants";
    r.s = "/admin/skills";
  }
  return r;
}

function shouldIgnore(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function KeyboardShortcuts({ activeRole }: { activeRole: ActiveRole }) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const gPressedRef = useRef(false);
  const gTimerRef = useRef<number | null>(null);

  useEffect(() => {
    function clearG() {
      gPressedRef.current = false;
      if (gTimerRef.current) {
        window.clearTimeout(gTimerRef.current);
        gTimerRef.current = null;
      }
    }

    function onKey(e: KeyboardEvent) {
      if (shouldIgnore(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape") {
        if (helpOpen) setHelpOpen(false);
        clearG();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((v) => !v);
        clearG();
        return;
      }

      if (gPressedRef.current) {
        const routes = routesFor(activeRole);
        const href = routes[e.key.toLowerCase()];
        clearG();
        if (href) {
          e.preventDefault();
          router.push(href);
        }
        return;
      }

      if (e.key === "g") {
        gPressedRef.current = true;
        gTimerRef.current = window.setTimeout(clearG, 1500);
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearG();
    };
  }, [activeRole, helpOpen, router]);

  if (!helpOpen) return null;

  return <HelpModal onClose={() => setHelpOpen(false)} activeRole={activeRole} />;
}

function HelpModal({
  onClose,
  activeRole,
}: {
  onClose: () => void;
  activeRole: ActiveRole;
}) {
  const shortcuts = shortcutsFor(activeRole);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbd-help-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 id="kbd-help-title" className="text-sm font-semibold">
              Atalhos de teclado
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <section>
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Navegar
            </h3>
            <ul className="space-y-1.5">
              {shortcuts.map((s) => (
                <li key={s.keys.join("-")} className="flex items-center justify-between">
                  <span className="text-sm">{s.label}</span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <kbd
                        key={i}
                        className="rounded border bg-muted px-1.5 py-0.5 text-[11px]"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-4 border-t pt-4">
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Geral
            </h3>
            <ul className="space-y-1.5">
              <li className="flex items-center justify-between">
                <span className="text-sm">Buscar</span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px]">
                    ⌘
                  </kbd>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px]">
                    K
                  </kbd>
                  <span className="text-[11px] text-muted-foreground">ou</span>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px]">
                    /
                  </kbd>
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm">Ajuda (este painel)</span>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px]">
                  ?
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm">Fechar modal</span>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px]">
                  esc
                </kbd>
              </li>
            </ul>
          </section>
        </div>

        <div className="border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          Digite{" "}
          <kbd className="rounded border bg-background px-1">g</kbd> seguido da
          letra em até 1.5s.
        </div>
      </div>
    </div>
  );
}
