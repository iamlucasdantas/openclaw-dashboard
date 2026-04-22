import Link from "next/link";
import { catMeta } from "@/lib/skill-meta";

type Props = {
  basePath: "/client/integrations" | "/admin/integrations";
  slug: string;
  name: string;
  description: string | null;
  version: string | null;
  agentsCount: number;
  totalActivities: number;
  todayActivities: number;
};

export function IntegrationCard({
  basePath,
  slug,
  name,
  description,
  version,
  agentsCount,
  totalActivities,
  todayActivities,
}: Props) {
  const meta = catMeta("integration");
  return (
    <Link
      href={`${basePath}/${slug}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl"
          >
            {emojiForSlug(slug)}
          </span>
          <div>
            <h3 className="font-semibold">{name}</h3>
            {version ? (
              <p className="text-[11px] text-muted-foreground">v{version}</p>
            ) : null}
          </div>
        </div>
        {agentsCount > 0 ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/20">
            conectada
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            não usada
          </span>
        )}
      </div>

      {description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>
          {agentsCount === 0
            ? "Nenhum assistente"
            : agentsCount === 1
              ? "1 assistente"
              : `${agentsCount} assistentes`}
        </span>
        <span className="tabular-nums">
          {totalActivities} atividade(s) · {todayActivities} hoje
        </span>
      </div>
    </Link>
  );
}

// Emojis específicos por slug de integração (fallback pro da categoria)
const EMOJI_BY_SLUG: Record<string, string> = {
  gmail: "📧",
  "google-calendar": "📅",
  "github-ops": "🛠️",
  "slack-inbound": "💬",
  "whatsapp-cloud": "💚",
  "ci-alerts": "🚨",
  "google-business-profile": "📍",
};

function emojiForSlug(slug: string) {
  return EMOJI_BY_SLUG[slug] ?? "🔌";
}
