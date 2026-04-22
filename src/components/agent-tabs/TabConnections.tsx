import Link from "next/link";
import { Github } from "lucide-react";
import { copy, t } from "@/lib/copy";
import { SkillsManager } from "@/components/skills-manager";
import { CronsManager } from "@/components/crons-manager";

type GithubRepo = { owner: string; name: string; role: string };

type Props = {
  agentDbId: string;
  scope: "admin" | "client";
  skillsInstalled: React.ComponentProps<typeof SkillsManager>["installed"];
  skillCatalog: React.ComponentProps<typeof SkillsManager>["catalog"];
  crons: React.ComponentProps<typeof CronsManager>["crons"];
  github: {
    org: string | null;
    repos: GithubRepo[];
  } | null;
  githubAdvancedHref: string;
  scheduleWizardHref: string;
};

export function TabConnections({
  agentDbId,
  scope,
  skillsInstalled,
  skillCatalog,
  crons,
  github,
  githubAdvancedHref,
  scheduleWizardHref,
}: Props) {
  return (
    <div className="space-y-6">
      <SkillsManager
        agentDbId={agentDbId}
        scope={scope}
        installed={skillsInstalled}
        catalog={skillCatalog}
      />

      <CronsManager
        agentDbId={agentDbId}
        scope={scope}
        crons={crons}
        wizardHref={scheduleWizardHref}
      />

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Github className="h-4 w-4" aria-hidden />
            {copy.agent.detail.connections.githubTitle}
          </h2>
        </div>
        <div className="space-y-3 p-5 text-sm">
          {github ? (
            <>
              <p>
                ✓{" "}
                {github.org
                  ? t(copy.agent.detail.connections.githubConnected, {
                      org: github.org,
                    })
                  : copy.agent.detail.connections.githubConnectedNoOrg}
              </p>
              {github.repos.length > 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground">
                    {copy.agent.detail.connections.githubReposIntro}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {github.repos.map((r) => (
                      <li
                        key={`${r.owner}/${r.name}`}
                        className="font-mono text-[13px]"
                      >
                        {r.owner}/{r.name}{" "}
                        <span className="text-[11px] text-muted-foreground">
                          ({r.role})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link
                href={githubAdvancedHref}
                className="inline-block pt-1 text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copy.agent.detail.connections.manageTechnical} →
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground">
              {copy.agent.detail.connections.githubEmpty}
              <br />
              <Link
                href={githubAdvancedHref}
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Conectar em modo desenvolvedor →
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
