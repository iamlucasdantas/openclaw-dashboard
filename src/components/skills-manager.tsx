"use client";

import Link from "next/link";
import { useTransition } from "react";
import { History, Plug, Power, PowerOff, Trash2 } from "lucide-react";
import { Button, Select } from "@/components/form";
import {
  installSkillOnAgent,
  toggleAgentSkill,
  uninstallAgentSkill,
} from "@/app/actions/skills";
import { catMeta } from "@/lib/skill-meta";
import { formatDate } from "@/lib/utils";

type InstalledSkill = {
  id: string; // AgentSkill id
  enabled: boolean;
  skill: {
    id: string;
    slug: string;
    name: string;
    category: string;
    version: string | null;
    description?: string | null;
  };
  lastActivity?: {
    summary: string;
    occurredAt: Date;
    status: string;
  } | null;
  activityCount?: number;
};

type CatalogSkill = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description?: string | null;
};

export function SkillsManager({
  agentDbId,
  scope,
  installed,
  catalog,
}: {
  agentDbId: string;
  scope: "admin" | "client";
  installed: InstalledSkill[];
  catalog: CatalogSkill[];
}) {
  const installedSkillIds = new Set(installed.map((i) => i.skill.id));
  const available = catalog.filter((c) => !installedSkillIds.has(c.id));

  // agrupa catálogo por categoria para o seletor de instalação
  const byCat = new Map<string, CatalogSkill[]>();
  for (const c of available) {
    const arr = byCat.get(c.category) ?? [];
    arr.push(c);
    byCat.set(c.category, arr);
  }

  const skillDetailHref = scope === "client" ? "/client/skills" : "/admin/skills";

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Plug className="h-4 w-4" /> Habilidades
        </h2>
        <p className="text-xs text-muted-foreground">
          O que este agente sabe fazer. Clique em uma habilidade para ver o histórico.
        </p>
      </div>

      <ul className="divide-y">
        {installed.map((i) => (
          <InstalledRow
            key={i.id}
            row={i}
            scope={scope}
            skillDetailHref={skillDetailHref}
          />
        ))}
        {installed.length === 0 && (
          <li className="px-5 py-6 text-center text-xs text-muted-foreground">
            Nenhuma habilidade instalada ainda. Use o seletor abaixo.
          </li>
        )}
      </ul>

      {available.length > 0 ? (
        <form
          action={async (fd) => {
            await installSkillOnAgent(agentDbId, scope, fd);
          }}
          className="space-y-2 border-t p-4"
        >
          <label className="block text-xs font-medium">
            Adicionar uma habilidade
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select name="skillId" required defaultValue="" className="flex-1">
              <option value="" disabled>
                Escolha uma habilidade...
              </option>
              {Array.from(byCat.entries()).map(([cat, items]) => {
                const meta = catMeta(cat);
                return (
                  <optgroup key={cat} label={`${meta.emoji} ${meta.label}`}>
                    {items.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </Select>
            <Button type="submit">Instalar</Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function InstalledRow({
  row,
  scope,
  skillDetailHref,
}: {
  row: InstalledSkill;
  scope: "admin" | "client";
  skillDetailHref: string;
}) {
  const [pending, startTransition] = useTransition();
  const meta = catMeta(row.skill.category);

  return (
    <li className="px-5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden>{meta.emoji}</span>
            <Link
              href={`${skillDetailHref}/${row.skill.id}`}
              className="text-sm font-medium hover:underline"
            >
              {row.skill.name}
            </Link>
            {row.skill.version ? (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
                v{row.skill.version}
              </span>
            ) : null}
            <span
              className={
                "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                (row.enabled
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                  : "bg-muted/60 text-muted-foreground border border-border")
              }
            >
              {row.enabled ? "ativa" : "desligada"}
            </span>
          </div>
          {row.skill.description ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {row.skill.description}
            </p>
          ) : null}
          {row.lastActivity ? (
            <div className="mt-1 text-[11px] text-muted-foreground">
              <span className="italic">“{row.lastActivity.summary}”</span>
              <span className="mx-1">·</span>
              <span>{formatDate(row.lastActivity.occurredAt)}</span>
              {row.activityCount && row.activityCount > 1 ? (
                <>
                  <span className="mx-1">·</span>
                  <Link
                    href={`${skillDetailHref}/${row.skill.id}`}
                    className="inline-flex items-center gap-0.5 hover:underline"
                  >
                    <History className="h-3 w-3" />
                    ver histórico ({row.activityCount})
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(() => {
                void toggleAgentSkill(row.id, scope, !row.enabled);
              })
            }
            className="h-8 px-2"
            title={row.enabled ? "Desligar" : "Ligar"}
          >
            {row.enabled ? (
              <PowerOff className="h-3.5 w-3.5" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Desinstalar habilidade "${row.skill.name}" deste agente?`))
                return;
              startTransition(() => {
                void uninstallAgentSkill(row.id, scope);
              });
            }}
            className="h-8 px-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}
