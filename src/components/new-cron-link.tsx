"use client";

import { useState } from "react";
import { Plus, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Select } from "./form";

// Botão "+ Nova tarefa" que abre popover pra escolher o assistente
// e leva direto pro wizard guiado (/admin/agents/[id]/schedule/new).
// Completa a auditoria H.2 (criar cron sem sair da tela de crons).
export function NewCronLink({
  agents,
  scope,
}: {
  agents: { agentId: string; name: string }[];
  scope: "admin" | "client";
}) {
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState(agents[0]?.agentId ?? "");
  const router = useRouter();

  if (agents.length === 0) return null;

  const href = `/${scope}/agents/${agentId}/schedule/new`;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        Nova tarefa
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-sm rounded-xl border bg-card p-5 shadow-xl">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Wand2 className="h-4 w-4" aria-hidden /> Nova tarefa agendada
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pra qual assistente você quer criar a tarefa?
            </p>

            <Select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="mt-3 w-full"
            >
              {agents.map((a) => (
                <option key={a.agentId} value={a.agentId}>
                  {a.name}
                </option>
              ))}
            </Select>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(href);
                }}
                disabled={!agentId}
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
