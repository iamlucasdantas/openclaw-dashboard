import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityForDisplay = {
  id: string;
  summary: string;
  body: string | null;
  contentType: string | null;
  contentUrl: string | null;
  status: string;
  occurredAt: Date;
  agent?: {
    agentId: string;
    name: string;
  };
};

const STATUS_DOT: Record<string, string> = {
  ok: "bg-emerald-500",
  error: "bg-destructive",
  warning: "bg-amber-500",
};

export function ActivityItem({
  a,
  agentHrefPrefix,
}: {
  a: ActivityForDisplay;
  agentHrefPrefix?: "/admin/agents" | "/client/agents";
}) {
  const hasContent =
    !!a.body ||
    (a.contentType === "image" && a.contentUrl) ||
    (a.contentType === "link" && a.contentUrl);

  return (
    <li className="px-5 py-3 text-sm">
      <details className="group">
        <summary
          className={cn(
            "flex cursor-pointer list-none items-start gap-3 rounded",
            hasContent && "hover:text-foreground"
          )}
        >
          <span
            className={cn(
              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
              STATUS_DOT[a.status] ?? "bg-muted-foreground/50"
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium">{a.summary}</span>
              {a.contentType === "image" ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                  imagem
                </span>
              ) : null}
              {a.contentType === "link" ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                  link
                </span>
              ) : null}
              {a.agent && agentHrefPrefix ? (
                <Link
                  href={`${agentHrefPrefix}/${a.agent.agentId}`}
                  className="text-[11px] text-muted-foreground hover:underline"
                >
                  {a.agent.name}
                </Link>
              ) : null}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {formatFull(a.occurredAt)}
            </div>
          </div>
          {hasContent ? (
            <span className="text-[11px] text-muted-foreground group-open:hidden">
              ver conteúdo
            </span>
          ) : null}
        </summary>

        {hasContent ? (
          <div className="mt-3 space-y-3 border-l-2 border-muted pl-5">
            {a.contentType === "image" && a.contentUrl ? (
              <a
                href={a.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block overflow-hidden rounded-md border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.contentUrl}
                  alt={a.summary}
                  className="block max-h-72 max-w-full object-contain"
                  loading="lazy"
                />
              </a>
            ) : null}

            {a.contentType === "link" && a.contentUrl ? (
              <a
                href={a.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <ExternalLink className="h-3 w-3" />
                {truncateUrl(a.contentUrl)}
              </a>
            ) : null}

            {a.body ? (
              <pre className="whitespace-pre-wrap break-words rounded-md bg-muted px-3 py-2 text-xs leading-relaxed">
                {a.body}
              </pre>
            ) : null}
          </div>
        ) : null}
      </details>
    </li>
  );
}

function formatFull(d: Date) {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncateUrl(url: string, max = 60) {
  if (url.length <= max) return url;
  return url.slice(0, max) + "…";
}
