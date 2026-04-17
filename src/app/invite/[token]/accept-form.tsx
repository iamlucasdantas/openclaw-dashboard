"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  acceptInvite,
  type AcceptInviteState,
} from "@/app/actions/invites";
import { Button, Field, FormError, Input } from "@/components/form";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Criando conta..." : "Aceitar convite"}
    </Button>
  );
}

export function AcceptInviteForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [state, formAction] = useFormState<AcceptInviteState, FormData>(
    acceptInvite,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <Field label="Email">
        <Input value={email} disabled readOnly />
      </Field>

      <Field label="Seu nome" error={state.fieldErrors?.name}>
        <Input name="name" required placeholder="Como você quer ser chamado" />
      </Field>

      <Field
        label="Senha"
        hint="Mínimo 8 caracteres."
        error={state.fieldErrors?.password}
      >
        <Input name="password" type="password" required minLength={8} />
      </Field>

      <FormError message={state.error} />

      <Submit />
    </form>
  );
}
