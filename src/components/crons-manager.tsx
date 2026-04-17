"use client";

import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Clock, Pause, Play, Trash2 } from "lucide-react";
import {
  createCron,
  deleteCron,
  toggleCronState,
  type CronFormState,
} from "@/app/actions/crons";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/form";
import { formatDate } from "@/lib/utils";

type CronRow = {
  id: string;
  name: string;
  schedule: string;
  command: string;
  state: string;
  lastRunAt: Date | null;
  lastRunStatus: string | null;
  lastRunMessage: string | null;
  nextRunAt: Date | null;
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function CronsManager({
  agentDbId,
  scope,
  crons,
}: {
  agentDbId: string;
  scope: "admin" | "client";
  crons: CronRow[];
}) {
  const action = createCron.bind(null, scope);
  const [state, formAction] = useFormState<CronFormState, FormData>(action, {});

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4" /> Crons
        </h2>
        <p className="text-xs text-muted-foreground">
          Tarefas agendadas do agente. Pausa = agent para rodar sem excluir.
        </p>
      </div>

      <ul className="divide-y">
        {crons.map((c) => (
          <CronRowItem key={c.id} row={c} />
        ))}
        {crons.length === 0 && (
          <li className="px-5 py-6 text-center text-xs text-muted-foreground">
            Nenhum cron cadastrado ainda.
          </li>
        )}
      </ul>

      <form action={formAction} className="space-y-3 border-t p-4">
        <input type="hidden" name="agentDbId" value={agentDbId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" error={state.fieldErrors?.name}>
            <Input name="name" required placeholder="Revisar PRs abertos" />
          </Field>
          <Field
            label="Agenda"
            hint="Cron 5 campos ou @hourly / @daily / @weekly / @monthly."
            error={state.fieldErrors?.schedule}
          >
            <Input name="schedule" required placeholder="*/30 * * * *" />
          </Field>
        </div>
        <Field label="Comando / prompt" error={state.fieldErrors?.command}>
          <Textarea
            name="command"
            rows={2}
            required
            placeholder="skill:github-ops review-open-prs"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Estado inicial" error={state.fieldErrors?.state}>
            <Select name="state" defaultValue="active">
              <option value="active">ativo</option>
              <option value="paused">pausado</option>
              <option value="disabled">desabilitado</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Submit label="Adicionar cron" />
          </div>
        </div>
        <FormError message={state.error} />
      </form>
    </section>
  );
}

function CronRowItem({ row }: { row: CronRow }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-start justify-between gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{row.name}</span>
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
            {row.schedule}
          </code>
          <StateBadge state={row.state} />
          {row.lastRunStatus ? (
            <span
              className={
                "rounded-full px-2 py-0.5 text-[11px] " +
                (row.lastRunStatus === "ok"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-destructive/10 text-destructive")
              }
            >
              última: {row.lastRunStatus}
            </span>
          ) : null}
        </div>
        <div className="mt-1 text-xs text-muted-foreground break-words">
          <code>{row.command}</code>
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          última exec: {formatDate(row.lastRunAt)} · próxima:{" "}
          {formatDate(row.nextRunAt)}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              void toggleCronState(row.id, row.state === "active" ? "paused" : "active");
            })
          }
          className="h-8 px-2"
          title={row.state === "active" ? "Pausar" : "Retomar"}
        >
          {row.state === "active" ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Excluir cron "${row.name}"?`)) return;
            startTransition(() => {
              void deleteCron(row.id);
            });
          }}
          className="h-8 px-2"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function StateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    paused: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    disabled: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] ${styles[state] ?? ""}`}>
      {state}
    </span>
  );
}
