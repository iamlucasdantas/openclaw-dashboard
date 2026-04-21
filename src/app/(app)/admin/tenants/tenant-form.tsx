"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  createTenant,
  updateTenant,
  type TenantFormState,
} from "@/app/actions/tenants";
import { Button, Field, FormError, Input, Textarea } from "@/components/form";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function TenantForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: { id: string; name: string; slug: string; description: string | null };
}) {
  const action =
    mode === "edit" && initial
      ? updateTenant.bind(null, initial.id)
      : createTenant;

  const [state, formAction] = useFormState<TenantFormState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <Field label="Nome" error={state.fieldErrors?.name}>
        <Input
          name="name"
          defaultValue={initial?.name}
          required
          placeholder="Acme Corp"
        />
      </Field>

      <Field
        label="Slug"
        hint="Identificador curto em URLs (ex: acme-corp)."
        error={state.fieldErrors?.slug}
      >
        <Input
          name="slug"
          defaultValue={initial?.slug}
          required
          placeholder="acme-corp"
        />
      </Field>

      <Field label="Descrição" error={state.fieldErrors?.description}>
        <Textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={3}
          placeholder="Contexto do cliente, canais principais, etc."
        />
      </Field>

      <FormError message={state.error} />

      <div className="flex gap-2">
        <Submit label={mode === "create" ? "Criar cliente" : "Salvar"} />
        <Link href="/admin/tenants">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
