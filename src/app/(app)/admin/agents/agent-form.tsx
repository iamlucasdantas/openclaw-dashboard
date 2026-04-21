"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createAgent,
  updateAgent,
  type AgentFormState,
} from "@/app/actions/agents";
import {
  Button,
  Field,
  FormError,
  Input,
  Select,
  Textarea,
} from "@/components/form";

// Modelos conhecidos — quando "outro" é selecionado, o usuário digita
// o nome livre (uso futuro com modelos customizados / providers raros).
const KNOWN_MODELS = [
  { value: "claude-opus-4-7", label: "Claude Opus 4.7 (mais poderoso)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (equilibrado)" },
  {
    value: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5 (rápido e barato)",
  },
];

function ModelField({
  initial,
  error,
}: {
  initial: string;
  error?: string;
}) {
  const knownValues = KNOWN_MODELS.map((m) => m.value);
  const isKnown = initial === "" || knownValues.includes(initial);
  const [selected, setSelected] = useState(
    isKnown ? initial || "claude-sonnet-4-6" : "other"
  );
  const [custom, setCustom] = useState(isKnown ? "" : initial);

  const effective = selected === "other" ? custom : selected;

  return (
    <Field
      label="Modelo (cérebro do assistente)"
      hint="Controla qualidade × custo. Muda apenas se souber o que está fazendo."
      error={error}
    >
      <input type="hidden" name="model" value={effective} />
      <div className="space-y-2">
        <Select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {KNOWN_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value="other">Outro (digitar nome exato)</option>
        </Select>
        {selected === "other" ? (
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="provider/model-id"
          />
        ) : null}
      </div>
    </Field>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function AgentForm({
  mode,
  scope = "admin",
  tenants,
  initial,
  defaultTenantId,
  cancelHref,
  templateDefaults,
}: {
  mode: "create" | "edit";
  scope?: "admin" | "client";
  tenants: { id: string; name: string; slug: string }[];
  initial?: {
    id: string;
    name: string;
    agentId: string;
    tenantId: string;
    persona: string | null;
    model: string | null;
    status: string;
  };
  defaultTenantId?: string;
  cancelHref?: string;
  templateDefaults?: {
    name: string;
    persona: string;
    model: string;
    skillSlugs: string[];
  };
}) {
  const action =
    mode === "edit" && initial
      ? updateAgent.bind(null, initial.id)
      : createAgent;

  const [state, formAction] = useFormState<AgentFormState, FormData>(action, {});

  const tenantLocked = scope === "client" && mode === "edit";
  const selectedTenant = tenants.find(
    (t) => t.id === (initial?.tenantId ?? defaultTenantId ?? tenants[0]?.id)
  );

  const cancel =
    cancelHref ?? (scope === "client" ? "/client/agents" : "/admin/agents");

  return (
    <form
      action={formAction}
      /* key força re-mount quando troca de agente — evita React reaproveitar
         defaultValue de um Textarea/Input anterior (bug da "persona vazia") */
      key={initial?.id ?? "create"}
      className="max-w-xl space-y-5"
    >
      <input type="hidden" name="scope" value={scope} />
      {templateDefaults?.skillSlugs ? (
        <input
          type="hidden"
          name="templateSkillSlugs"
          value={templateDefaults.skillSlugs.join(",")}
        />
      ) : null}

      <Field label="Cliente (tenant)" error={state.fieldErrors?.tenantId}>
        {tenantLocked && selectedTenant ? (
          <>
            <Input value={`${selectedTenant.name} (${selectedTenant.slug})`} disabled readOnly />
            <input type="hidden" name="tenantId" value={selectedTenant.id} />
          </>
        ) : (
          <Select
            name="tenantId"
            required
            defaultValue={initial?.tenantId ?? defaultTenantId ?? ""}
          >
            <option value="" disabled>
              Selecione um cliente...
            </option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Nome amigável" error={state.fieldErrors?.name}>
        <Input
          name="name"
          defaultValue={initial?.name ?? templateDefaults?.name ?? ""}
          required
          placeholder="Acme Support WA"
        />
      </Field>

      <Field
        label="agentId"
        hint="Identificador único. Convenção: tenant-funcao-nn (ex: acme-wa-support-01)."
        error={state.fieldErrors?.agentId}
      >
        <Input
          name="agentId"
          defaultValue={initial?.agentId}
          required
          placeholder="acme-wa-support-01"
        />
      </Field>

      <Field
        label="Persona"
        hint={
          mode === "edit" && !initial?.persona
            ? "Este assistente ainda não tem persona. Descreva o comportamento esperado — é o que guia as respostas."
            : "O que ele faz, o tom de voz, os limites."
        }
        error={state.fieldErrors?.persona}
      >
        <Textarea
          name="persona"
          defaultValue={
            initial?.persona ?? templateDefaults?.persona ?? ""
          }
          rows={4}
          placeholder="Resumo do comportamento e responsabilidades do agente."
        />
      </Field>

      {templateDefaults?.skillSlugs && templateDefaults.skillSlugs.length > 0 ? (
        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            Este modelo sugere instalar:
          </p>
          <ul className="mt-1 flex flex-wrap gap-1">
            {templateDefaults.skillSlugs.map((s) => (
              <li
                key={s}
                className="rounded-full bg-background px-2 py-0.5 text-[11px] border"
              >
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px]">
            Você pode instalar/remover depois em <strong>Conexões</strong>.
          </p>
        </div>
      ) : null}

      <ModelField
        initial={initial?.model ?? templateDefaults?.model ?? ""}
        error={state.fieldErrors?.model}
      />

      {/* Status é reflexo do heartbeat e do flag manual "degraded".
       *  Não exibimos como campo editável em /edit — não faz sentido
       *  mudar manualmente pra "online" sem receber heartbeat.
       *  Em /create, deixamos apenas a opção "degraded" como flag. */}
      {mode === "create" ? (
        <Field
          label="Marcar como degradado?"
          hint="Use apenas se o assistente está em manutenção; heartbeat não sobrescreve."
        >
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="status"
              value="degraded"
              defaultChecked={initial?.status === "degraded"}
            />
            Sim, manter marcado como degradado
          </label>
        </Field>
      ) : (
        <input
          type="hidden"
          name="status"
          value={initial?.status ?? "offline"}
        />
      )}

      <FormError message={state.error} />

      <div className="flex gap-2">
        <Submit label={mode === "create" ? "Criar agente" : "Salvar"} />
        <Link href={cancel}>
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
