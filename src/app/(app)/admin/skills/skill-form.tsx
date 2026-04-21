"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  createSkill,
  updateSkill,
  type SkillFormState,
} from "@/app/actions/skills";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/form";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function SkillForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: {
    id: string;
    slug: string;
    name: string;
    category: string;
    description: string | null;
    source: string | null;
    version: string | null;
  };
}) {
  const action =
    mode === "edit" && initial ? updateSkill.bind(null, initial.id) : createSkill;
  const [state, formAction] = useFormState<SkillFormState, FormData>(action, {});

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <Field label="Slug" error={state.fieldErrors?.slug}>
        <Input
          name="slug"
          defaultValue={initial?.slug}
          required
          placeholder="gmail"
        />
      </Field>
      <Field label="Nome" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={initial?.name} required placeholder="Gmail" />
      </Field>
      <Field label="Categoria" error={state.fieldErrors?.category}>
        <Select name="category" defaultValue={initial?.category ?? "integration"}>
          <option value="integration">integration</option>
          <option value="llm">llm</option>
          <option value="utility">utility</option>
          <option value="automation">automation</option>
        </Select>
      </Field>
      <Field label="Descrição" error={state.fieldErrors?.description}>
        <Textarea
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fonte" error={state.fieldErrors?.source}>
          <Input
            name="source"
            defaultValue={initial?.source ?? ""}
            placeholder="clawhub"
          />
        </Field>
        <Field label="Versão" error={state.fieldErrors?.version}>
          <Input
            name="version"
            defaultValue={initial?.version ?? ""}
            placeholder="1.0.0"
          />
        </Field>
      </div>
      <FormError message={state.error} />
      <div className="flex gap-2">
        <Submit label={mode === "create" ? "Criar skill" : "Salvar"} />
        <Link href="/admin/skills">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
