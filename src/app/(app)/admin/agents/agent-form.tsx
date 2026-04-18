"use client";

import Link from "next/link";
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
    <form action={formAction} className="max-w-xl space-y-5">
      <input type="hidden" name="scope" value={scope} />

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
          defaultValue={initial?.name}
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

      <Field label="Persona" error={state.fieldErrors?.persona}>
        <Textarea
          name="persona"
          defaultValue={initial?.persona ?? ""}
          rows={3}
          placeholder="Resumo do comportamento e responsabilidades do agente."
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Modelo LLM" error={state.fieldErrors?.model}>
          <Input
            name="model"
            defaultValue={initial?.model ?? ""}
            placeholder="claude-opus-4-7"
          />
        </Field>

        <Field label="Status" error={state.fieldErrors?.status}>
          <Select name="status" defaultValue={initial?.status ?? "offline"}>
            <option value="online">online</option>
            <option value="offline">offline</option>
            <option value="degraded">degraded</option>
          </Select>
        </Field>
      </div>

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
