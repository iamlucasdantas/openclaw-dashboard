"use client";

import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Github, Trash2 } from "lucide-react";
import {
  addGithubRepo,
  removeGithubIntegration,
  removeGithubRepo,
  saveGithubIntegration,
  type GithubFormState,
} from "@/app/actions/github";
import { Button, Field, FormError, Input, Select } from "@/components/form";

const MODE_LABEL: Record<string, string> = {
  "gh-cli": "GitHub CLI (gh)",
  mcp: "Servidor MCP",
  api: "REST API direta",
};

const SCOPE_LABEL: Record<string, string> = {
  read: "Somente leitura",
  issues: "Leitura + Issues",
  prs: "Leitura + Issues + PRs",
  admin: "Admin",
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function GithubSection({
  agentDbId,
  scope,
  integration,
}: {
  agentDbId: string;
  scope: "admin" | "client";
  integration:
    | null
    | {
        id: string;
        mode: string;
        scope: string;
        org: string | null;
        defaultBranch: string | null;
        tokenPreview: string | null;
        repos: {
          id: string;
          owner: string;
          name: string;
          role: string;
        }[];
      };
}) {
  const saveAction = saveGithubIntegration.bind(null, agentDbId, scope);
  const [saveState, saveForm] = useFormState<GithubFormState, FormData>(
    saveAction,
    {}
  );

  return (
    <section className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Github className="h-4 w-4" /> GitHub
          </h2>
          <p className="text-xs text-muted-foreground">
            Registro de integração (menor privilégio). O token reside no host do
            agente — aqui guardamos apenas metadados e os últimos 4 chars para
            verificação visual.
          </p>
        </div>
        {integration ? (
          <RemoveIntegrationButton agentDbId={agentDbId} scope={scope} />
        ) : null}
      </div>

      <div className="space-y-5 p-5">
        <form action={saveForm} className="grid gap-4 sm:grid-cols-2">
          <Field label="Modo" error={saveState.fieldErrors?.mode}>
            <Select name="mode" defaultValue={integration?.mode ?? "gh-cli"}>
              {Object.entries(MODE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Escopo do token" error={saveState.fieldErrors?.scope}>
            <Select name="scope" defaultValue={integration?.scope ?? "read"}>
              {Object.entries(SCOPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Organização (opcional)"
            error={saveState.fieldErrors?.org}
          >
            <Input
              name="org"
              defaultValue={integration?.org ?? ""}
              placeholder="iamlucasdantas"
            />
          </Field>

          <Field
            label="Branch padrão"
            error={saveState.fieldErrors?.defaultBranch}
          >
            <Input
              name="defaultBranch"
              defaultValue={integration?.defaultBranch ?? ""}
              placeholder="main"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label={
                integration
                  ? "Novo token (opcional — só envie se for trocar)"
                  : "Token (apenas para salvar os últimos 4 chars)"
              }
              hint={
                integration?.tokenPreview
                  ? `Preview atual: …${integration.tokenPreview}`
                  : "Este valor NÃO é armazenado em texto. Apenas os últimos 4 chars."
              }
              error={saveState.fieldErrors?.token}
            >
              <Input
                name="token"
                type="password"
                placeholder={
                  integration ? "deixe em branco para manter" : "ghp_xxxx…"
                }
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <FormError message={saveState.error} />
            {saveState.success ? (
              <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {saveState.success}
              </p>
            ) : null}
            <Submit label={integration ? "Salvar alterações" : "Criar integração"} />
          </div>
        </form>

        {integration ? (
          <RepoManager
            agentDbId={agentDbId}
            scope={scope}
            integrationId={integration.id}
            repos={integration.repos}
          />
        ) : null}
      </div>
    </section>
  );
}

function RemoveIntegrationButton({
  agentDbId,
  scope,
}: {
  agentDbId: string;
  scope: "admin" | "client";
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remover integração GitHub deste agente?")) return;
        startTransition(() => {
          void removeGithubIntegration(agentDbId, scope);
        });
      }}
      className="h-8 px-2 text-xs"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Remover integração
    </Button>
  );
}

function RepoManager({
  agentDbId,
  scope,
  integrationId,
  repos,
}: {
  agentDbId: string;
  scope: "admin" | "client";
  integrationId: string;
  repos: { id: string; owner: string; name: string; role: string }[];
}) {
  const addAction = addGithubRepo.bind(null, agentDbId, scope);
  const [addState, addForm] = useFormState<GithubFormState, FormData>(
    addAction,
    {}
  );

  return (
    <div className="border-t pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Repositórios vinculados</h3>
        <span className="text-xs text-muted-foreground">
          {repos.length} {repos.length === 1 ? "repo" : "repos"}
        </span>
      </div>

      <ul className="mb-4 divide-y rounded-md border">
        {repos.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <code className="font-mono">
                {r.owner}/<strong>{r.name}</strong>
              </code>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] uppercase tracking-wider">
                {r.role}
              </span>
            </div>
            <RemoveRepoButton
              repoId={r.id}
              scope={scope}
              label={`${r.owner}/${r.name}`}
            />
          </li>
        ))}
        {repos.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-muted-foreground">
            Nenhum repositório vinculado ainda.
          </li>
        )}
      </ul>

      <form action={addForm} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Field label="Owner" error={addState.fieldErrors?.owner}>
          <Input name="owner" placeholder="iamlucasdantas" required />
        </Field>
        <Field label="Nome do repo" error={addState.fieldErrors?.name}>
          <Input name="name" placeholder="openclaw-dashboard" required />
        </Field>
        <Field label="Papel" error={addState.fieldErrors?.role}>
          <Select name="role" defaultValue="read">
            <option value="read">read</option>
            <option value="write">write</option>
            <option value="admin">admin</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Submit label="Adicionar" />
        </div>
        <div className="sm:col-span-4">
          <FormError message={addState.error} />
          {addState.success ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              {addState.success}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function RemoveRepoButton({
  repoId,
  scope,
  label,
}: {
  repoId: string;
  scope: "admin" | "client";
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Remover vínculo do repositório "${label}"?`)) return;
        startTransition(() => {
          void removeGithubRepo(repoId, scope);
        });
      }}
      className="h-8 px-2"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
