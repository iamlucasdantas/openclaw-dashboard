"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  changeOwnPassword,
  updateOwnProfile,
  type UserFormState,
} from "@/app/actions/users";
import { Button, Field, FormError, Input } from "@/components/form";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string };
}) {
  const [state, formAction] = useFormState<UserFormState, FormData>(
    updateOwnProfile,
    {}
  );
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={initial.name} required />
      </Field>
      <Field label="Email">
        <Input value={initial.email} disabled readOnly />
      </Field>
      <FormError message={state.error} />
      {state.success ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <Submit label="Salvar" />
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useFormState<UserFormState, FormData>(
    changeOwnPassword,
    {}
  );
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Senha atual" error={state.fieldErrors?.currentPassword}>
        <Input name="currentPassword" type="password" required />
      </Field>
      <Field
        label="Nova senha"
        hint="Mínimo 8 caracteres."
        error={state.fieldErrors?.newPassword}
      >
        <Input name="newPassword" type="password" required minLength={8} />
      </Field>
      <FormError message={state.error} />
      {state.success ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <Submit label="Trocar senha" />
    </form>
  );
}
