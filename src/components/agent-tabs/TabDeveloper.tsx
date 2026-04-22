import { AlertTriangle, Download } from "lucide-react";
import { copy } from "@/lib/copy";
import { HeartbeatIntegration } from "@/components/heartbeat-integration";
import { GithubSection } from "@/components/github-integration";

type Props = {
  agent: {
    id: string;
    agentId: string;
    lastHeartbeatAt: Date | null;
    lastVersion: string | null;
    heartbeatSecret: string | null;
  };
  scope: "admin" | "client";
  githubIntegration: React.ComponentProps<typeof GithubSection>["integration"];
};

export function TabDeveloper({ agent, scope, githubIntegration }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        <div className="flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <p>{copy.agent.detail.dev.warning}</p>
        </div>
        <a
          href="https://github.com/iamlucasdantas/openclaw-dashboard#-conectando-seus-agentes-nodejs"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-3 w-3" aria-hidden />
          Baixar módulo Node.js
        </a>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            {copy.agent.detail.dev.identifier}
          </h2>
        </div>
        <code className="block overflow-x-auto rounded bg-muted px-2 py-1 font-mono text-xs">
          {agent.agentId}
        </code>
      </section>

      <HeartbeatIntegration agent={agent} scope={scope} />

      <GithubSection
        agentDbId={agent.id}
        scope={scope}
        integration={githubIntegration}
      />
    </div>
  );
}
