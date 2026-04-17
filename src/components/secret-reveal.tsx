"use client";

import { useState, useTransition } from "react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/form";
import { rotateAgentSecret } from "@/app/actions/agents";

export function SecretReveal({
  agentDbId,
  secret,
  scope = "admin",
}: {
  agentDbId: string;
  secret: string | null;
  scope?: "admin" | "client";
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const display = secret
    ? visible
      ? secret
      : secret.slice(0, 8) + "…" + "•".repeat(24)
    : "(não gerado)";

  async function copy() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copie o secret:", secret);
    }
  }

  function rotate() {
    if (!confirm("Rotacionar o secret invalida qualquer heartbeat em curso. Continuar?"))
      return;
    startTransition(() => {
      void rotateAgentSecret(agentDbId, scope);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded bg-muted px-2 py-1 font-mono text-xs">
          {display}
        </code>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setVisible((v) => !v)}
          className="h-8 px-2"
          title={visible ? "Esconder" : "Revelar"}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={copy}
          className="h-8 px-2"
          title="Copiar"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "copiado" : ""}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={rotate}
          disabled={pending}
          className="h-8 px-2"
          title="Rotacionar"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
