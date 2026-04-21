"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button, Select } from "@/components/form";
import { updateFieldMap } from "@/app/actions/prospecting";
import { GHL_FIELDS, SOURCE_FIELDS } from "@/lib/prospecting-fields";

export function MappingForm({
  campaignId,
  initial,
}: {
  campaignId: string;
  initial: Record<string, string>;
}) {
  const [state, setState] = useState<Record<string, string>>(initial);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function save() {
    start(async () => {
      await updateFieldMap(campaignId, state);
      setSavedAt(new Date());
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b bg-muted/40 px-5 py-2 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span>Campo do lead</span>
            <span aria-hidden>→</span>
            <span>Campo na HighLevel</span>
          </div>
        </div>
        <ul className="divide-y">
          {SOURCE_FIELDS.map((sf) => {
            const current = state[sf.key] ?? "";
            return (
              <li
                key={sf.key}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{sf.label}</p>
                  <code className="text-[11px] text-muted-foreground">
                    {sf.key}
                  </code>
                </div>
                <span className="text-muted-foreground" aria-hidden>
                  →
                </span>
                <Select
                  value={current}
                  onChange={(e) =>
                    setState({ ...state, [sf.key]: e.target.value })
                  }
                  className="w-full"
                >
                  {GHL_FIELDS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </Select>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-2">
        {savedAt ? (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
            Salvo às{" "}
            {savedAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            Alterações são aplicadas aos próximos leads sincronizados.
          </span>
        )}
        <Button type="button" disabled={pending} onClick={save}>
          <Save className="h-4 w-4" aria-hidden />
          {pending ? "Salvando..." : "Salvar mapeamento"}
        </Button>
      </div>
    </div>
  );
}
