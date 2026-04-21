import { headers } from "next/headers";
import { formatDate } from "@/lib/utils";
import { SecretReveal } from "@/components/secret-reveal";

export async function HeartbeatIntegration({
  agent,
  scope = "admin",
}: {
  agent: {
    id: string;
    agentId: string;
    lastHeartbeatAt: Date | null;
    lastVersion: string | null;
    heartbeatSecret: string | null;
  };
  scope?: "admin" | "client";
}) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const endpoint = `${proto}://${host}/api/agents/${agent.agentId}/heartbeat`;
  const secretPreview = agent.heartbeatSecret ?? "<SECRET>";

  const curl = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${secretPreview}" \\
  -H "Content-Type: application/json" \\
  -d '{"version":"1.0.0","status":"online"}'`;

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-5 py-3">
        <h2 className="text-sm font-semibold">Integração · Heartbeat</h2>
        <p className="text-xs text-muted-foreground">
          O agente deve bater neste endpoint periodicamente (sugestão: a cada 60s).
          Sem heartbeat nos últimos 2 minutos → marcado como <em>sem heartbeat</em>.
        </p>
      </div>
      <div className="space-y-4 p-5 text-sm">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            Endpoint
          </div>
          <code className="block overflow-x-auto rounded bg-muted px-2 py-1 font-mono text-xs">
            POST {endpoint}
          </code>
        </div>

        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            Secret (Bearer)
          </div>
          <SecretReveal
            agentDbId={agent.id}
            secret={agent.heartbeatSecret}
            scope={scope}
          />
        </div>

        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            Exemplo (curl)
          </div>
          <pre className="overflow-x-auto rounded bg-muted p-3 font-mono text-[11px] leading-relaxed">
{curl}
          </pre>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 border-t pt-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Último heartbeat
            </div>
            <div className="mt-0.5 font-medium">
              {formatDate(agent.lastHeartbeatAt)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Versão reportada
            </div>
            <div className="mt-0.5 font-medium">{agent.lastVersion ?? "—"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
