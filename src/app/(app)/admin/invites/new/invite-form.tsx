"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  createInvite,
  type InviteFormState,
} from "@/app/actions/invites";
import {
  Button,
  Field,
  FormError,
  Input,
  Select,
} from "@/components/form";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Gerando..." : "Gerar convite"}
    </Button>
  );
}

export function InviteForm({
  tenants,
}: {
  tenants: { id: string; name: string; slug: string }[];
}) {
  const [state, formAction] = useFormState<InviteFormState, FormData>(
    createInvite,
    {}
  );

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" required placeholder="pessoa@empresa.com" />
      </Field>

      <Field
        label="Cliente vinculado"
        hint="O usuário entra como 'cliente' deste tenant. Deixe vazio se for apenas admin."
        error={state.fieldErrors?.tenantId}
      >
        <Select name="tenantId" defaultValue="">
          <option value="">— nenhum —</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.slug})
            </option>
          ))}
        </Select>
      </Field>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="isAdmin" />
        Dar role <strong>admin</strong> (acesso global)
      </label>

      <FormError message={state.error} />

      <div className="flex gap-2">
        <Submit />
        <Link href="/admin/invites">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
