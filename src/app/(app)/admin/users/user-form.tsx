"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  createUser,
  updateUser,
  setUserPassword,
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

export function CreateUserForm() {
  const [state, formAction] = useFormState<UserFormState, FormData>(
    createUser,
    {}
  );
  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <Field label="Nome" error={state.fieldErrors?.name}>
        <Input name="name" required placeholder="Ex: Maria Silva" />
      </Field>
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" required />
      </Field>
      <Field
        label="Senha inicial"
        hint="Mínimo 8 caracteres. Usuário deve trocar após o primeiro login."
        error={state.fieldErrors?.password}
      >
        <Input name="password" type="password" required minLength={8} />
      </Field>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="isAdmin" />
        Dar role <strong>admin</strong> (acesso global)
      </label>
      <FormError message={state.error} />
      <div className="flex gap-2">
        <Submit label="Criar usuário" />
        <Link href="/admin/users">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}

export function EditUserForm({
  user,
  isSelf,
}: {
  user: { id: string; name: string; email: string; isAdmin: boolean };
  isSelf: boolean;
}) {
  const action = updateUser.bind(null, user.id);
  const [state, formAction] = useFormState<UserFormState, FormData>(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={user.name} required />
      </Field>
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input name="email" type="email" defaultValue={user.email} required />
      </Field>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isAdmin"
          defaultChecked={user.isAdmin}
          disabled={isSelf}
        />
        Role <strong>admin</strong>
        {isSelf ? (
          <span className="text-xs text-muted-foreground">
            (não é possível remover a própria role de admin)
          </span>
        ) : null}
      </label>
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

export function SetPasswordForm({ userId }: { userId: string }) {
  const action = setUserPassword.bind(null, userId);
  const [state, formAction] = useFormState<UserFormState, FormData>(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nova senha" error={state.fieldErrors?.password}>
        <Input name="password" type="password" required minLength={8} />
      </Field>
      <FormError message={state.error} />
      {state.success ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <Submit label="Redefinir senha" />
    </form>
  );
}
