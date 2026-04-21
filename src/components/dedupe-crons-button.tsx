"use client";

import { useTransition, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/form";
import { deleteDuplicatedCrons } from "@/app/actions/crons";

export function DedupeCronsBanner({ duplicates }: { duplicates: number }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<number | null>(null);

  if (duplicates === 0) return null;
  if (done !== null) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        <Check className="h-4 w-4" aria-hidden />
        {done} tarefa(s) duplicada(s) removida(s).
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">
            {duplicates} tarefa(s) duplicada(s) detectada(s)
          </p>
          <p className="text-[12px] opacity-80">
            Mesmo assistente + nome + agenda aparecendo mais de uma vez. Isso
            bagunça a contagem e dispara execuções em dobro.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await deleteDuplicatedCrons();
            setDone(r?.deleted ?? 0);
          })
        }
      >
        {pending ? "Limpando..." : "Limpar duplicadas"}
      </Button>
    </div>
  );
}
