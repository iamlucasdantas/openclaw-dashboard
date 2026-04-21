"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Plus,
  Target,
  X,
} from "lucide-react";
import {
  createCampaign,
  updateCampaign,
  type CampaignFormState,
} from "@/app/actions/prospecting";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/form";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

export type WizardState = {
  name: string;
  ghlLocationId: string;
  ghlApiKey: string;
  areaLabel: string;
  radiusKm: number;
  niches: string[];
  filters: {
    gbp: boolean;
    website: boolean;
    social: boolean;
    email: boolean;
    phone: boolean;
  };
  schedule: "daily" | "weekly" | "manual";
  scheduleTime: string; // HH:MM
  autoExpand: boolean;
  expandAfterDays: number;
  expandStepKm: number;
  maxRadiusKm: number;
};

const DEFAULT_STATE: WizardState = {
  name: "",
  ghlLocationId: "",
  ghlApiKey: "",
  areaLabel: "",
  radiusKm: 10,
  niches: [],
  filters: {
    gbp: true,
    website: true,
    social: false,
    email: true,
    phone: true,
  },
  schedule: "daily",
  scheduleTime: "09:00",
  autoExpand: true,
  expandAfterDays: 3,
  expandStepKm: 5,
  maxRadiusKm: 100,
};

const POPULAR_NICHES = [
  "Salões de beleza",
  "Barbearias",
  "Clínicas de estética",
  "Academias",
  "Pet shops",
  "Restaurantes",
  "Cafeterias",
  "Consultórios odontológicos",
  "Imobiliárias",
  "Advocacia",
  "Contabilidade",
  "Marketing digital",
  "Studios de fotografia",
  "Floriculturas",
  "Óticas",
];

export function ProspectingWizard({
  mode,
  tenants,
  scope,
  cancelHref,
  campaignId,
  initial,
}: {
  mode: "create" | "edit";
  tenants: { id: string; name: string; slug: string }[];
  scope: "admin" | "client";
  cancelHref: string;
  campaignId?: string;
  initial?: Partial<WizardState> & { tenantId?: string };
}) {
  const [step, setStep] = useState<Step>(1);
  const [tenantId, setTenantId] = useState<string>(
    initial?.tenantId ?? tenants[0]?.id ?? ""
  );
  const [state, setState] = useState<WizardState>({
    ...DEFAULT_STATE,
    ...initial,
    filters: { ...DEFAULT_STATE.filters, ...(initial?.filters ?? {}) },
  });
  const [nicheInput, setNicheInput] = useState("");
  const [validation, setValidation] = useState<
    Partial<Record<keyof WizardState, string>>
  >({});

  function next() {
    if (step === 1) {
      const errs: typeof validation = {};
      if (!state.name.trim()) errs.name = "Dê um nome à campanha.";
      if (!state.ghlLocationId.trim())
        errs.ghlLocationId = "Location ID é obrigatório.";
      if (mode === "create" && !state.ghlApiKey.trim())
        errs.ghlApiKey = "Informe a chave privada da HighLevel.";
      if (Object.keys(errs).length) {
        setValidation(errs);
        return;
      }
    }
    if (step === 2) {
      const errs: typeof validation = {};
      if (!state.areaLabel.trim())
        errs.areaLabel = "Diga onde procurar (cidade ou endereço).";
      if (state.niches.length === 0)
        errs.niches = "Escolha ao menos um nicho.";
      if (Object.keys(errs).length) {
        setValidation(errs);
        return;
      }
    }
    setValidation({});
    if (step < 4) setStep((step + 1) as Step);
  }
  function back() {
    if (step > 1) setStep((step - 1) as Step);
  }

  return (
    <div className="space-y-6">
      <Progress current={step} />

      {step === 1 ? (
        <Step1
          state={state}
          onChange={setState}
          tenants={tenants}
          tenantId={tenantId}
          onTenantChange={setTenantId}
          validation={validation}
          mode={mode}
          cancelHref={cancelHref}
          onNext={next}
        />
      ) : step === 2 ? (
        <Step2
          state={state}
          onChange={setState}
          nicheInput={nicheInput}
          onNicheInput={setNicheInput}
          validation={validation}
          cancelHref={cancelHref}
          onBack={back}
          onNext={next}
        />
      ) : step === 3 ? (
        <Step3
          state={state}
          onChange={setState}
          cancelHref={cancelHref}
          onBack={back}
          onNext={next}
        />
      ) : (
        <Step4
          mode={mode}
          scope={scope}
          campaignId={campaignId}
          tenantId={tenantId}
          state={state}
          onChange={setState}
          cancelHref={cancelHref}
          onBack={back}
        />
      )}
    </div>
  );
}

function Progress({ current }: { current: Step }) {
  const labels = [
    "Conectar HighLevel",
    "Onde procurar",
    "Filtros",
    "Agenda",
  ];
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Passo {current} de 4 · {labels[current - 1]}
      </p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition",
              i <= current ? "bg-primary" : "bg-muted"
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

function Step1({
  state,
  onChange,
  tenants,
  tenantId,
  onTenantChange,
  validation,
  mode,
  cancelHref,
  onNext,
}: {
  state: WizardState;
  onChange: (s: WizardState) => void;
  tenants: { id: string; name: string; slug: string }[];
  tenantId: string;
  onTenantChange: (v: string) => void;
  validation: Partial<Record<keyof WizardState, string>>;
  mode: "create" | "edit";
  cancelHref: string;
  onNext: () => void;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Conectar ao HighLevel</h2>
        <p className="text-sm text-muted-foreground">
          Quando um lead aparecer, ele vira um contato na subconta que você
          escolher aqui.
        </p>
      </div>

      {tenants.length > 1 ? (
        <Field label="Cliente">
          <Select
            value={tenantId}
            onChange={(e) => onTenantChange(e.target.value)}
            required
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="Nome da campanha" error={validation.name}>
        <Input
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          placeholder="Ex: Salões em Curitiba"
          autoFocus
        />
      </Field>

      <Field
        label="Location ID da subconta"
        hint="Está em Settings → Business Profile da subconta do seu cliente na HighLevel."
        error={validation.ghlLocationId}
      >
        <Input
          value={state.ghlLocationId}
          onChange={(e) =>
            onChange({ ...state, ghlLocationId: e.target.value })
          }
          placeholder="Ex: aBcD12EfGh34iJkL56Mn"
        />
      </Field>

      <Field
        label={
          mode === "edit"
            ? "Chave privada (deixe vazio para manter)"
            : "Chave privada da HighLevel"
        }
        hint="Você pode gerar em Settings → Business Info → API Keys."
        error={validation.ghlApiKey}
      >
        <Input
          type="password"
          value={state.ghlApiKey}
          onChange={(e) => onChange({ ...state, ghlApiKey: e.target.value })}
          placeholder={mode === "edit" ? "••••" : "pit-xxxxxxxx"}
        />
      </Field>

      <div className="flex items-center justify-between pt-2">
        <Link href={cancelHref}>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </Link>
        <div className="flex gap-2">
          {/* Testar conexão vem quando API real for plugada */}
          <Button type="button" onClick={onNext}>
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function Step2({
  state,
  onChange,
  nicheInput,
  onNicheInput,
  validation,
  cancelHref,
  onBack,
  onNext,
}: {
  state: WizardState;
  onChange: (s: WizardState) => void;
  nicheInput: string;
  onNicheInput: (v: string) => void;
  validation: Partial<Record<keyof WizardState, string>>;
  cancelHref: string;
  onBack: () => void;
  onNext: () => void;
}) {
  function toggleNiche(name: string) {
    const has = state.niches.includes(name);
    onChange({
      ...state,
      niches: has
        ? state.niches.filter((n) => n !== name)
        : [...state.niches, name],
    });
  }

  function addCustom() {
    const v = nicheInput.trim();
    if (!v) return;
    if (state.niches.includes(v)) {
      onNicheInput("");
      return;
    }
    onChange({ ...state, niches: [...state.niches, v] });
    onNicheInput("");
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Onde procurar</h2>
        <p className="text-sm text-muted-foreground">
          Escolha a região e o que buscar. Comece pequeno; a campanha pode
          expandir sozinha depois.
        </p>
      </div>

      <Field
        label="Cidade ou endereço"
        hint="Ex: Curitiba - PR · Av. Paulista, São Paulo"
        error={validation.areaLabel}
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            value={state.areaLabel}
            onChange={(e) =>
              onChange({ ...state, areaLabel: e.target.value })
            }
            placeholder="Ex: Curitiba - PR"
          />
        </div>
      </Field>

      <Field label={`Raio: ${state.radiusKm} km`}>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={state.radiusKm}
          onChange={(e) =>
            onChange({ ...state, radiusKm: Number(e.target.value) })
          }
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </Field>

      <Field label="Nichos (pode escolher vários)" error={validation.niches}>
        <div className="flex flex-wrap gap-2">
          {POPULAR_NICHES.map((n) => {
            const active = state.niches.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggleNiche(n)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-accent"
                )}
              >
                {active ? <Check className="h-3 w-3" aria-hidden /> : null}
                {n}
              </button>
            );
          })}
        </div>

        {state.niches.filter((n) => !POPULAR_NICHES.includes(n)).length >
        0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {state.niches
              .filter((n) => !POPULAR_NICHES.includes(n))
              .map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                >
                  {n}
                  <button
                    type="button"
                    onClick={() => toggleNiche(n)}
                    aria-label={`remover ${n}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <Input
            value={nicheInput}
            onChange={(e) => onNicheInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Adicionar um nicho personalizado..."
          />
          <Button type="button" variant="secondary" onClick={addCustom}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </Field>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Link href={cancelHref}>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
        </div>
        <Button type="button" onClick={onNext}>
          Próximo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function Step3({
  state,
  onChange,
  cancelHref,
  onBack,
  onNext,
}: {
  state: WizardState;
  onChange: (s: WizardState) => void;
  cancelHref: string;
  onBack: () => void;
  onNext: () => void;
}) {
  function toggle(key: keyof WizardState["filters"]) {
    onChange({
      ...state,
      filters: { ...state.filters, [key]: !state.filters[key] },
    });
  }

  const options: { key: keyof WizardState["filters"]; label: string; hint: string }[] = [
    { key: "gbp", label: "Tem Google Business Profile", hint: "Perfil público no Google Maps" },
    { key: "website", label: "Tem site próprio", hint: "Excluir quem só tem redes" },
    { key: "social", label: "Tem redes sociais", hint: "Instagram ou Facebook com presença ativa" },
    { key: "email", label: "Email de contato identificável", hint: "Não aceitar só formulário" },
    { key: "phone", label: "Telefone de contato", hint: "Fixo ou celular" },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Filtros</h2>
        <p className="text-sm text-muted-foreground">
          Só incluir leads que tenham essas informações. Quanto mais filtros,
          menos leads — mas mais qualificados.
        </p>
      </div>

      <ul className="space-y-2">
        {options.map((o) => {
          const active = state.filters[o.key];
          return (
            <li key={o.key}>
              <button
                type="button"
                onClick={() => toggle(o.key)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:bg-accent"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40"
                  )}
                  aria-hidden
                >
                  {active ? <Check className="h-3 w-3" /> : null}
                </div>
                <div>
                  <p className="text-sm font-medium">{o.label}</p>
                  <p className="text-xs text-muted-foreground">{o.hint}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Link href={cancelHref}>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
        </div>
        <Button type="button" onClick={onNext}>
          Próximo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function Step4({
  mode,
  scope,
  campaignId,
  tenantId,
  state,
  onChange,
  cancelHref,
  onBack,
}: {
  mode: "create" | "edit";
  scope: "admin" | "client";
  campaignId?: string;
  tenantId: string;
  state: WizardState;
  onChange: (s: WizardState) => void;
  cancelHref: string;
  onBack: () => void;
}) {
  const action =
    mode === "edit" && campaignId
      ? updateCampaign.bind(null, campaignId)
      : createCampaign;
  const [actionState, formAction] = useFormState<CampaignFormState, FormData>(
    action,
    {}
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Quando rodar</h2>
        <p className="text-sm text-muted-foreground">
          Escolha a frequência. Você pode mudar depois.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {(
          [
            { v: "daily", label: "Todo dia", hint: "1× por dia no horário" },
            { v: "weekly", label: "Toda semana", hint: "Às segundas" },
            { v: "manual", label: "Só manualmente", hint: "Eu rodo quando quiser" },
          ] as const
        ).map((opt) => {
          const active = state.schedule === opt.v;
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => onChange({ ...state, schedule: opt.v })}
              aria-pressed={active}
              className={cn(
                "flex flex-col rounded-xl border p-3 text-left transition",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-muted-foreground/20 hover:bg-accent"
              )}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-[11px] text-muted-foreground">
                {opt.hint}
              </span>
            </button>
          );
        })}
      </div>

      {state.schedule !== "manual" ? (
        <Field label="Horário">
          <Input
            type="time"
            value={state.scheduleTime}
            onChange={(e) =>
              onChange({ ...state, scheduleTime: e.target.value })
            }
            step={60}
            className="w-32"
          />
        </Field>
      ) : null}

      <section className="rounded-xl border bg-card p-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.autoExpand}
            onChange={(e) =>
              onChange({ ...state, autoExpand: e.target.checked })
            }
            className="mt-0.5"
          />
          <span>
            <strong>Expandir automaticamente</strong>
            <p className="text-xs text-muted-foreground">
              Quando não encontrar novos leads por alguns dias, o raio
              aumenta sozinho até o limite.
            </p>
          </span>
        </label>

        {state.autoExpand ? (
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground">
                Depois de quantos dias sem leads
              </span>
              <Input
                type="number"
                min={1}
                max={30}
                value={state.expandAfterDays}
                onChange={(e) =>
                  onChange({
                    ...state,
                    expandAfterDays: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground">
                Aumentar raio em (km)
              </span>
              <Input
                type="number"
                min={1}
                max={100}
                value={state.expandStepKm}
                onChange={(e) =>
                  onChange({
                    ...state,
                    expandStepKm: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground">Raio máximo (km)</span>
              <Input
                type="number"
                min={state.radiusKm}
                max={1000}
                value={state.maxRadiusKm}
                onChange={(e) =>
                  onChange({
                    ...state,
                    maxRadiusKm: Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
        ) : null}
      </section>

      {/* resumo */}
      <section className="rounded-xl border bg-muted/30 p-4 text-sm">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Resumo
        </p>
        <ul className="mt-2 space-y-1 text-[13px]">
          <li>
            <strong>{state.name || "Sem nome"}</strong>
          </li>
          <li>
            Busca em <strong>{state.areaLabel || "—"}</strong> (raio{" "}
            {state.radiusKm} km)
          </li>
          <li>
            Nichos:{" "}
            {state.niches.length ? state.niches.join(", ") : <em>nenhum</em>}
          </li>
          <li>
            Roda:{" "}
            <strong>
              {state.schedule === "daily"
                ? `todo dia às ${state.scheduleTime}`
                : state.schedule === "weekly"
                  ? `toda segunda às ${state.scheduleTime}`
                  : "só manualmente"}
            </strong>
          </li>
        </ul>
      </section>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="name" value={state.name} />
        <input
          type="hidden"
          name="ghlLocationId"
          value={state.ghlLocationId}
        />
        <input type="hidden" name="ghlApiKey" value={state.ghlApiKey} />
        <input type="hidden" name="areaLabel" value={state.areaLabel} />
        <input type="hidden" name="radiusKm" value={state.radiusKm} />
        <input type="hidden" name="niches" value={state.niches.join(",")} />
        <input
          type="hidden"
          name="filters"
          value={JSON.stringify(state.filters)}
        />
        <input type="hidden" name="schedule" value={state.schedule} />
        <input type="hidden" name="scheduleTime" value={state.scheduleTime} />
        <input
          type="hidden"
          name="autoExpand"
          value={state.autoExpand ? "true" : "false"}
        />
        <input
          type="hidden"
          name="expandAfterDays"
          value={state.expandAfterDays}
        />
        <input type="hidden" name="expandStepKm" value={state.expandStepKm} />
        <input type="hidden" name="maxRadiusKm" value={state.maxRadiusKm} />

        <FormError message={actionState.error} />
        {actionState.success ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {actionState.success}
          </p>
        ) : null}

        <div className="flex flex-col items-stretch gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Link href={cancelHref}>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
          </div>
          <Submit label={mode === "create" ? "Criar campanha" : "Salvar"} />
        </div>
      </form>
    </section>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Target className="h-4 w-4" />
      {pending ? "Salvando..." : label}
    </Button>
  );
}
