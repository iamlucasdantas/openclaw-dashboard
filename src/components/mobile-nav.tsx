"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { ActiveRole } from "@/lib/active-role";
import { NavLinks } from "./nav-links";

export function MobileNav({ activeRole }: { activeRole: ActiveRole }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // fecha ao navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // bloqueia scroll quando drawer aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">OC</span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">OpenClaw</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {activeRole === "admin" ? "Admin" : "Cliente"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks
                activeRole={activeRole}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <div className="border-t p-3 text-[11px] text-muted-foreground">
              v0.1 · painel multi-tenant
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
