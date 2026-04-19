import Link from "next/link";
import { AGENT_TEMPLATES } from "@/lib/agent-templates";

export function AgentTemplatesGallery({
  basePath,
  scratchHref,
}: {
  basePath: string; // ex: /client/agents/new
  scratchHref: string; // link "criar do zero"
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">Como você quer começar?</h2>
        <p className="text-xs text-muted-foreground">
          Escolha um modelo pronto e ajuste depois — ou comece do zero.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENT_TEMPLATES.map((tpl) => (
          <Link
            key={tpl.id}
            href={`${basePath}?template=${tpl.id}`}
            className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between">
              <span aria-hidden className="text-2xl">
                {tpl.emoji}
              </span>
            </div>
            <h3 className="text-sm font-semibold">{tpl.name}</h3>
            <p className="text-xs text-muted-foreground">{tpl.shortDescription}</p>
            {tpl.tagline ? (
              <p className="mt-auto text-[11px] italic text-muted-foreground/80">
                {tpl.tagline}
              </p>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="border-t pt-4 text-center">
        <Link
          href={scratchHref}
          className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ou criar do zero →
        </Link>
      </div>
    </div>
  );
}
