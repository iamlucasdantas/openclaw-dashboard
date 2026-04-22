"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { copy, t } from "@/lib/copy";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/form";
import { createCron, type CronFormState } from "@/app/actions/crons";
import { FrequencyCard, type FrequencyKey } from "./FrequencyCard";
import { SchedulePreview } from "./SchedulePreview";
import {
  formatClock,
  formatDayLabel,
  humanizeSchedule,
  nextRunsFor,
} from "@/lib/schedule";

type Step = 1 | 2 | 3;

type WizardState = {
  name: string;
  command: string;
  freq: FrequencyKey;
  minuteInterval: number;
  dailyHour: number;
  dailyMinute: number;
  weeklyDay: number;
  weeklyHour: number;
  weeklyMinute: number;
  monthlyDay: number;
  monthlyHour: number;
  monthlyMinute: number;
  advanced: string;
  initialState: "active" | "paused";
};

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

function buildCron(s: WizardState): string {
  switch (s.freq) {
    case "minutes":
      return `*/${Math.max(1, Math.min(59, s.minuteInterval))} * * * *`;
    case "hourly":
      return "0 * * * *";
    case "daily":
      return `${s.dailyMinute} ${s.dailyHour} * * *`;
    case "weekly":
      return `${s.weeklyMinute} ${s.weeklyHour} * * ${s.weeklyDay}`;
    case "monthly":
      return `${s.monthlyMinute} ${s.monthlyHour} ${s.monthlyDay} * *`;
    case "advanced":
      return s.advanced.trim() || "0 9 * * *";
  }
}

const DEFAULT_STATE: WizardState = {
  name: "",
  command: "",
  freq: "daily",
  minuteInterval: 30,
  dailyHour: 9,
  dailyMinute: 0,
  weeklyDay: 1,
  weeklyHour: 8,
  weeklyMinute: 0,
  monthlyDay: 1,
  monthlyHour: 9,
  monthlyMinute: 0,
  advanced: "",
  initialState: "active",
};

export function ScheduleWizard({
  agentDbId,
  agentName,
  scope,
  cancelHref,
}: {
  agentDbId: string;
  agentName: string;
  scope: "admin" | "client";
  cancelHref: string;
}) {
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [validation, setValidation] = useState<{
    name?: string;
    command?: string;
  }>({});

  const cron = buildCron(state);

  function next() {
    if (step === 1) {
      const errors: typeof validation = {};
      if (!state.name.trim()) errors.name = copy.schedule.wizard.errors.nameRequired;
      if (!state.command.trim())
        errors.command = copy.schedule.wizard.errors.commandRequired;
      if (Object.keys(errors).length > 0) {
        setValidation(errors);
        return;
      }
      setValidation({});
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  }

  function back() {
    if (step > 1) setStep((step - 1) as Step);
  }

  return (
    <div className="space-y-6">
      <ProgressBar current={step} />

      {step === 1 ? (
        <StepTask
          state={state}
          onChange={setState}
          validation={validation}
          cancelHref={cancelHref}
          onNext={next}
        />
      ) : step === 2 ? (
        <StepWhen
          state={state}
          onChange={setState}
          cron={cron}
          cancelHref={cancelHref}
          onNext={next}
          onBack={back}
        />
      ) : (
        <StepConfirm
          state={state}
          cron={cron}
          agentDbId={agentDbId}
          agentName={agentName}
          scope={scope}
          cancelHref={cancelHref}
          onBack={back}
        />
      )}
    </div>
  );
}

function ProgressBar({ current }: { current: Step }) {
  const labels = [
    copy.schedule.wizard.steps.task,
    copy.schedule.wizard.steps.when,
    copy.schedule.wizard.steps.confirm,
  ];
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {t(copy.schedule.wizard.stepIndicator, { current, total: 3 })} ·{" "}
        {labels[current - 1]}
      </p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={
              "h-1.5 flex-1 rounded-full transition " +
              (i <= current ? "bg-primary" : "bg-muted")
            }
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

function StepTask({
  state,
  onChange,
  validation,
  cancelHref,
  onNext,
}: {
  state: WizardState;
  onChange: (s: WizardState) => void;
  validation: { name?: string; command?: string };
  cancelHref: string;
  onNext: () => void;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {copy.schedule.wizard.steps.task}
        </h2>
        <p className="text-sm text-muted-foreground">
          {copy.schedule.wizard.subtitles.task}
        </p>
      </div>

      <Field label={copy.schedule.wizard.fields.name} error={validation.name}>
        <Input
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          placeholder={copy.schedule.wizard.fields.namePlaceholder}
          autoFocus
        />
      </Field>

      <Field
        label={copy.schedule.wizard.fields.command}
        hint={copy.schedule.wizard.fields.commandHint}
        error={validation.command}
      >
        <Textarea
          rows={3}
          value={state.command}
          onChange={(e) => onChange({ ...state, command: e.target.value })}
          placeholder={copy.schedule.wizard.fields.commandPlaceholder}
        />
      </Field>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Link href={cancelHref}>
          <Button type="button" variant="ghost">
            {copy.schedule.wizard.buttons.cancel}
          </Button>
        </Link>
        <Button type="button" onClick={onNext}>
          {copy.schedule.wizard.buttons.next}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function StepWhen({
  state,
  onChange,
  cron,
  cancelHref,
  onNext,
  onBack,
}: {
  state: WizardState;
  onChange: (s: WizardState) => void;
  cron: string;
  cancelHref: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const f = state.freq;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {copy.schedule.wizard.steps.when}
        </h2>
        <p className="text-sm text-muted-foreground">
          {copy.schedule.wizard.subtitles.when}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(copy.schedule.wizard.frequency) as FrequencyKey[]).map(
          (k) => {
            const meta = copy.schedule.wizard.frequency[k];
            return (
              <FrequencyCard
                key={k}
                freq={k}
                label={meta.label}
                emoji={meta.emoji}
                description={meta.description}
                active={f === k}
                onSelect={(next) => onChange({ ...state, freq: next })}
              />
            );
          }
        )}
      </div>

      <FrequencyDetails state={state} onChange={onChange} />

      <SchedulePreview schedule={cron} />

      <div className="flex flex-col items-stretch gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            {copy.schedule.wizard.buttons.back}
          </Button>
          <Link href={cancelHref}>
            <Button type="button" variant="ghost">
              {copy.schedule.wizard.buttons.cancel}
            </Button>
          </Link>
        </div>
        <Button type="button" onClick={onNext}>
          {copy.schedule.wizard.buttons.next}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function FrequencyDetails({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: WizardState) => void;
}) {
  if (state.freq === "minutes") {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span>A cada</span>
          <select
            value={state.minuteInterval}
            onChange={(e) =>
              onChange({ ...state, minuteInterval: Number(e.target.value) })
            }
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {[1, 5, 10, 15, 20, 30, 45].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <span>minuto(s)</span>
        </label>
      </div>
    );
  }

  if (state.freq === "hourly") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Rodando sempre no minuto 0 de cada hora (00:00, 01:00, 02:00, …).
      </div>
    );
  }

  if (state.freq === "daily") {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span>Todos os dias às</span>
          <TimePicker
            hour={state.dailyHour}
            minute={state.dailyMinute}
            onHour={(v) => onChange({ ...state, dailyHour: v })}
            onMinute={(v) => onChange({ ...state, dailyMinute: v })}
          />
        </label>
      </div>
    );
  }

  if (state.freq === "weekly") {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span>Toda</span>
          <select
            value={state.weeklyDay}
            onChange={(e) =>
              onChange({ ...state, weeklyDay: Number(e.target.value) })
            }
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {WEEKDAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <span>às</span>
          <TimePicker
            hour={state.weeklyHour}
            minute={state.weeklyMinute}
            onHour={(v) => onChange({ ...state, weeklyHour: v })}
            onMinute={(v) => onChange({ ...state, weeklyMinute: v })}
          />
        </label>
      </div>
    );
  }

  if (state.freq === "monthly") {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span>No dia</span>
          <select
            value={state.monthlyDay}
            onChange={(e) =>
              onChange({ ...state, monthlyDay: Number(e.target.value) })
            }
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <span>do mês, às</span>
          <TimePicker
            hour={state.monthlyHour}
            minute={state.monthlyMinute}
            onHour={(v) => onChange({ ...state, monthlyHour: v })}
            onMinute={(v) => onChange({ ...state, monthlyMinute: v })}
          />
        </label>
      </div>
    );
  }

  // advanced
  return (
    <div className="space-y-1 rounded-xl border border-border bg-card p-4">
      <input
        value={state.advanced}
        onChange={(e) => onChange({ ...state, advanced: e.target.value })}
        placeholder="0 9 * * *"
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
      />
      <p className="text-[11px] text-muted-foreground">
        Formato cron de 5 campos (minuto hora dia mês dia-semana).
      </p>
    </div>
  );
}

function TimePicker({
  hour,
  minute,
  onHour,
  onMinute,
}: {
  hour: number;
  minute: number;
  onHour: (h: number) => void;
  onMinute: (m: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-input bg-background px-1 py-0.5">
      <select
        value={hour}
        onChange={(e) => onHour(Number(e.target.value))}
        className="border-0 bg-transparent px-1 py-0.5 text-sm tabular-nums focus:outline-none"
      >
        {Array.from({ length: 24 }, (_, i) => i).map((v) => (
          <option key={v} value={v}>
            {String(v).padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className="text-sm">:</span>
      <select
        value={minute}
        onChange={(e) => onMinute(Number(e.target.value))}
        className="border-0 bg-transparent px-1 py-0.5 text-sm tabular-nums focus:outline-none"
      >
        {[0, 15, 30, 45].map((v) => (
          <option key={v} value={v}>
            {String(v).padStart(2, "0")}
          </option>
        ))}
      </select>
    </div>
  );
}

function StepConfirm({
  state,
  cron,
  agentDbId,
  agentName,
  scope,
  cancelHref,
  onBack,
}: {
  state: WizardState;
  cron: string;
  agentDbId: string;
  agentName: string;
  scope: "admin" | "client";
  cancelHref: string;
  onBack: () => void;
}) {
  const createBound = createCron.bind(null, scope);
  const [actionState, formAction] = useFormState<CronFormState, FormData>(
    createBound,
    {}
  );

  const upcoming = nextRunsFor(cron, 1);
  const first = upcoming[0];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {copy.schedule.wizard.steps.confirm}
        </h2>
        <p className="text-sm text-muted-foreground">
          {copy.schedule.wizard.subtitles.confirm}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <p className="text-sm text-muted-foreground">
          {t(copy.schedule.wizard.confirm.intro, { name: agentName })}
        </p>
        <p className="text-base font-medium">“{state.command}”</p>
        <p className="text-sm">
          📅 {humanizeSchedule(cron)}
        </p>
        {first ? (
          <p className="text-xs text-muted-foreground">
            {t(copy.schedule.wizard.confirm.firstRun, {
              when: `${formatDayLabel(first)}, ${formatClock(first)}`,
            })}
          </p>
        ) : null}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="agentDbId" value={agentDbId} />
        <input type="hidden" name="name" value={state.name} />
        <input type="hidden" name="command" value={state.command} />
        <input type="hidden" name="schedule" value={cron} />

        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            {copy.schedule.wizard.confirm.stateLabel}
          </legend>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="state"
                value="active"
                defaultChecked
              />
              {copy.schedule.wizard.confirm.stateActive}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="state" value="paused" />
              {copy.schedule.wizard.confirm.statePaused}
            </label>
          </div>
        </fieldset>

        <FormError message={actionState.error} />

        <div className="flex flex-col items-stretch gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              {copy.schedule.wizard.buttons.back}
            </Button>
            <Link href={cancelHref}>
              <Button type="button" variant="ghost">
                {copy.schedule.wizard.buttons.cancel}
              </Button>
            </Link>
          </div>
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Check className="h-4 w-4" />
      {pending ? "Criando..." : copy.schedule.wizard.buttons.create}
    </Button>
  );
}
