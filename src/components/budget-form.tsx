"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  setAgentBudget,
  setTenantBudget,
  type BudgetFormState,
} from "@/app/actions/budgets";
import { Button, Field, Input } from "@/components/form";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="secondary">
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  );
}

export function TenantBudgetForm({
  tenantId,
  current,
}: {
  tenantId: string;
  current: number | null;
}) {
  const action = setTenantBudget.bind(null, tenantId);
  const [state, formAction] = useFormState<BudgetFormState, FormData>(action, {});
  return (
    <BudgetFormInner state={state} formAction={formAction} current={current} />
  );
}

export function AgentBudgetForm({
  agentDbId,
  scope,
  current,
}: {
  agentDbId: string;
  scope: "admin" | "client";
  current: number | null;
}) {
  const action = setAgentBudget.bind(null, agentDbId, scope);
  const [state, formAction] = useFormState<BudgetFormState, FormData>(action, {});
  return (
    <BudgetFormInner state={state} formAction={formAction} current={current} />
  );
}

function BudgetFormInner({
  state,
  formAction,
  current,
}: {
  state: BudgetFormState;
  formAction: (fd: FormData) => void;
  current: number | null;
}) {
  return (
    <form action={formAction} className="flex items-end gap-2">
      <Field label="Limite mensal (USD)" hint="Vazio ou 0 = sem limite.">
        <Input
          type="number"
          min="0"
          step="1"
          name="monthlyBudgetUsd"
          defaultValue={current ?? ""}
          placeholder="100"
          className="w-32"
        />
      </Field>
      <Submit />
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-xs text-emerald-300">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
