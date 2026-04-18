"use client";

import { useTransition } from "react";
import { Plug, Power, PowerOff, Trash2 } from "lucide-react";
import { Button, Select } from "@/components/form";
import {
  installSkillOnAgent,
  toggleAgentSkill,
  uninstallAgentSkill,
} from "@/app/actions/skills";

type InstalledSkill = {
  id: string; // AgentSkill id
  enabled: boolean;
  skill: {
    id: string;
    slug: string;
    name: string;
    category: string;
    version: string | null;
  };
};

type CatalogSkill = {
  id: string;
  slug: string;
  name: string;
  category: string;
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

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Plug className="h-4 w-4" /> Skills
        </h2>
        <p className="text-xs text-muted-foreground">
          Skills instaladas neste agente. Habilite/desabilite ou remova.
        </p>
      </div>

      <ul className="divide-y">
        {installed.map((i) => (
          <InstalledRow key={i.id} row={i} scope={scope} />
        ))}
        {installed.length === 0 && (
          <li className="px-5 py-6 text-center text-xs text-muted-foreground">
            Nenhuma skill instalada ainda.
          </li>
        )}
      </ul>

      {available.length > 0 ? (
        <form
          action={async (fd) => {
            await installSkillOnAgent(agentDbId, scope, fd);
          }}
          className="flex gap-2 border-t p-4"
        >
          <Select name="skillId" required defaultValue="">
            <option value="" disabled>
              Instalar skill...
            </option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.slug})
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Instalar
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function InstalledRow({
  row,
  scope,
}: {
  row: InstalledSkill;
  scope: "admin" | "client";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{row.skill.name}</span>
            <code className="text-[11px] text-muted-foreground">
              {row.skill.slug}
            </code>
            {row.skill.version ? (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
                v{row.skill.version}
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {row.skill.category}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={
            "rounded-full px-2 py-0.5 text-xs " +
            (row.enabled
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-muted text-muted-foreground")
          }
        >
          {row.enabled ? "ativa" : "desligada"}
        </span>
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
            if (!confirm(`Desinstalar skill "${row.skill.name}" deste agente?`))
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
    </li>
  );
}
