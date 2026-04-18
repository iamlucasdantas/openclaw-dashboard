"use client";

import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CalendarDays, Clock, Pause, Play, Trash2 } from "lucide-react";
import {
  createCron,
  deleteCron,
  toggleCronState,
  type CronFormState,
} from "@/app/actions/crons";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/form";
import { SchedulePicker } from "@/components/schedule-picker";
import { formatDate } from "@/lib/utils";
import { formatClock, formatDayLabel, humanizeSchedule, nextRunsFor } from "@/lib/schedule";

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
          <CalendarDays className="h-4 w-4" /> Tarefas agendadas
        </h2>
        <p className="text-xs text-muted-foreground">
          Cada tarefa é uma rotina que o agente executa sozinho em horários
          definidos. Você pode pausar ou excluir a qualquer momento.
        </p>
      </div>

      <ul className="divide-y">
        {crons.map((c) => (
          <CronRowItem key={c.id} row={c} />
        ))}
        {crons.length === 0 && (
          <li className="px-5 py-6 text-center text-xs text-muted-foreground">
            Nenhuma tarefa agendada ainda.
          </li>
        )}
      </ul>

      <form action={formAction} className="space-y-4 border-t p-4">
        <input type="hidden" name="agentDbId" value={agentDbId} />

        <Field label="Nome" error={state.fieldErrors?.name}>
          <Input name="name" required placeholder="Ex: Revisar PRs abertos" />
        </Field>

        <Field label="O que o agente deve fazer" error={state.fieldErrors?.command}>
          <Textarea
            name="command"
            rows={2}
            required
            placeholder='Ex: "Revisar PRs abertos e me avisar"'
          />
        </Field>

        <div>
          <label className="mb-2 block text-sm font-medium">Quando executar</label>
          <SchedulePicker name="schedule" error={state.fieldErrors?.schedule} />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Começa como..." error={state.fieldErrors?.state}>
            <Select name="state" defaultValue="active">
              <option value="active">Ativa (já começa a rodar)</option>
              <option value="paused">Pausada (criar sem rodar)</option>
              <option value="disabled">Desabilitada</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Submit label="Adicionar tarefa" />
          </div>
        </div>

        <FormError message={state.error} />
      </form>
    </section>
  );
}

function CronRowItem({ row }: { row: CronRow }) {
  const [pending, startTransition] = useTransition();
  const upcoming = row.state === "active" ? nextRunsFor(row.schedule, 3) : [];

  return (
    <li className="flex items-start justify-between gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{row.name}</span>
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
        <div className="mt-0.5 text-xs">
          <span className="text-foreground">{humanizeSchedule(row.schedule)}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground break-words">
          {row.command}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          última execução: {formatDate(row.lastRunAt)}
        </div>
        {upcoming.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
            <span className="text-muted-foreground">Próximas:</span>
            {upcoming.map((d, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 tabular-nums"
              >
                <Clock className="h-3 w-3" />
                {formatDayLabel(d)} · {formatClock(d)}
              </span>
            ))}
          </div>
        ) : null}
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
            if (!confirm(`Excluir tarefa "${row.name}"?`)) return;
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
  const labels: Record<string, string> = {
    active: "ativa",
    paused: "pausada",
    disabled: "desabilitada",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] ${styles[state] ?? ""}`}>
      {labels[state] ?? state}
    </span>
  );
}
