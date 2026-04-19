"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2, X } from "lucide-react";
import { Button } from "./form";
import { cn } from "@/lib/utils";

type Props = {
  action: () => Promise<void>;
  confirmText: string; // palavra que o usuário precisa digitar exatamente
  triggerLabel?: string; // texto do botão que abre o diálogo
  title: string; // título do diálogo
  description?: string; // parágrafo introdutório
  impactLines?: string[]; // bullets "o que será perdido"
  ctaLabel?: string; // texto do botão de confirmação
  cancelLabel?: string;
};

export function TypeToConfirmButton({
  action,
  confirmText,
  triggerLabel = "Excluir",
  title,
  description,
  impactLines = [],
  ctaLabel,
  cancelLabel = "Cancelar",
}: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const match = typed.trim() === confirmText;

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {triggerLabel}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tc-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 id="tc-title" className="text-base font-semibold">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="-m-1 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {description ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}

            {impactLines.length > 0 ? (
              <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="mb-1 font-medium">Isso vai:</p>
                <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                  {impactLines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-4 text-[13px] text-muted-foreground">
              Para confirmar, digite{" "}
              <strong className="text-foreground">{confirmText}</strong>:
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              className={cn(
                "mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2",
                match
                  ? "border-emerald-400 focus:ring-emerald-300"
                  : "border-input focus:ring-ring"
              )}
              placeholder={confirmText}
              aria-invalid={!match}
            />

            <form action={action} className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                {cancelLabel}
              </Button>
              <SubmitButton disabled={!match} label={ctaLabel ?? triggerLabel} />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SubmitButton({
  disabled,
  label,
}: {
  disabled: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={disabled || pending}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      {pending ? "Processando..." : label}
    </Button>
  );
}
