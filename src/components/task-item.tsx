import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, CheckCircle2, Clock, XCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskForDisplay = {
  id: string;
  title: string;
  status: string;
  category: string | null;
  result: string | null;
  resultType: string | null;
  resultUrl: string | null;
  deliverableData: string | null;
  startedAt: Date;
  resolvedAt: Date | null;
  _count?: { activities: number };
  agent?: {
    agentId: string;
    name: string;
  };
};

type DeliverableData = {
  title?: string;
  content?: string;
  images?: Array<string | { url: string; alt?: string }>;
  links?: Array<string | { url: string; label?: string }>;
  platforms?: string[];
  scheduledDate?: string;
  caption?: string;
};

type TaskFamily = "blog" | "social" | "other";

type NormalizedLink = {
  href: string;
  label: string;
  isBlogLike: boolean;
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-emerald-400", label: "Concluída" },
  in_progress: { icon: Clock, color: "text-amber-400", label: "Em andamento" },
  failed: { icon: XCircle, color: "text-red-400", label: "Falhou" },
};

const CATEGORY_LABELS: Record<string, string> = {
  carousel: "Carrossel",
  social_post: "Mídia Post",
  article: "Blog Post",
  support: "Suporte",
  news: "Blog Post",
  crm: "CRM",
  other: "Outro",
};

const CATEGORY_COLORS: Record<string, string> = {
  carousel: "bg-violet-500/20 text-violet-300",
  social_post: "bg-blue-500/20 text-blue-300",
  article: "bg-cyan-500/20 text-cyan-300",
  support: "bg-amber-500/20 text-amber-300",
  news: "bg-emerald-500/20 text-emerald-300",
  crm: "bg-pink-500/20 text-pink-300",
  other: "bg-gray-500/20 text-gray-300",
};

const BLOG_CATEGORIES = new Set(["article", "news"]);
const BLOG_SOURCE_PLATFORMS = new Set(["wordpress", "highlevel"]);
const SOCIAL_PLATFORMS = new Set(["google", "instagram", "facebook", "tiktok", "linkedin", "whatsapp", "x", "twitter"]);

const PLATFORM_META: Record<string, { icon: string; label: string; badge: string }> = {
  instagram: { icon: "📸", label: "Instagram", badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  facebook: { icon: "📘", label: "Facebook", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  tiktok: { icon: "🎵", label: "TikTok", badge: "bg-neutral-500/20 text-neutral-200 border-neutral-500/30" },
  wordpress: { icon: "📝", label: "WordPress", badge: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  highlevel: { icon: "⚡", label: "HighLevel", badge: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  google: { icon: "🔍", label: "Google", badge: "bg-red-500/20 text-red-300 border-red-500/30" },
  linkedin: { icon: "💼", label: "LinkedIn", badge: "bg-blue-600/20 text-blue-200 border-blue-600/30" },
  whatsapp: { icon: "💬", label: "WhatsApp", badge: "bg-green-500/20 text-green-300 border-green-500/30" },
  twitter: { icon: "𝕏", label: "X", badge: "bg-neutral-500/20 text-neutral-200 border-neutral-500/30" },
  x: { icon: "𝕏", label: "X", badge: "bg-neutral-500/20 text-neutral-200 border-neutral-500/30" },
};

const BLOG_LINK_PATTERNS = /(wordpress|wp-content|wp-json|\/blog\/|\/news\/|\/article\/|\/posts\/|thebeautybarqc\.com|wrexham\.com\.br)/i;

function decodeEntities(value: string) {
  // Named entities
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&trade;/g, "\u2122")
    .replace(/&copy;/g, "\u00A9")
    .replace(/&reg;/g, "\u00AE")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&bull;/g, "\u2022")
    .replace(/&middot;/g, "\u00B7")
    .replace(/&laquo;/g, "\u00AB")
    .replace(/&raquo;/g, "\u00BB")
    .replace(/&prime;/g, "\u2032")
    .replace(/&eacute;/g, "\u00E9")
    .replace(/&Eacute;/g, "\u00C9")
    .replace(/&aacute;/g, "\u00E1")
    .replace(/&Aacute;/g, "\u00C1")
    .replace(/&oacute;/g, "\u00F3")
    .replace(/&Oacute;/g, "\u00D3")
    .replace(/&iacute;/g, "\u00ED")
    .replace(/&Iacute;/g, "\u00CD")
    .replace(/&uacute;/g, "\u00FA")
    .replace(/&Uacute;/g, "\u00DA")
    .replace(/&atilde;/g, "\u00E3")
    .replace(/&otilde;/g, "\u00F5")
    .replace(/&ccedil;/g, "\u00E7")
    .replace(/&Ccedil;/g, "\u00C7")
    // Numeric entities (decimal)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    // Numeric entities (hex)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function stripHtml(value: string) {
  return decodeEntities(
    value
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/\u00a0/g, " ")
  )
    .replace(/[ ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function normalizePlatform(value: string) {
  const lower = value.trim().toLowerCase();
  if (lower === "twitter") return "x";
  return lower;
}

function isBlogLink(url: string) {
  return BLOG_LINK_PATTERNS.test(url);
}

function toUrl(v: string | { url: string } | undefined | null): string {
  if (!v) return "";
  return typeof v === "string" ? v : v.url;
}

function toAlt(v: string | { alt?: string } | undefined | null, fallback = ""): string {
  if (!v) return fallback;
  return typeof v === "string" ? fallback : (v.alt || fallback);
}

function truncateUrl(url: string, max = 50) {
  if (!url || url.length <= max) return url || "";
  return url.slice(0, max) + "…";
}

function formatShort(d: Date) {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeLinks(links: DeliverableData["links"]) {
  return (links || [])
    .map((link) => {
      const href = toUrl(link).trim();
      if (!href) return null;
      const label = typeof link === "string"
        ? truncateUrl(link)
        : (link.label || truncateUrl(link.url));
      return {
        href,
        label,
        isBlogLike: isBlogLink(href),
      } satisfies NormalizedLink;
    })
    .filter((link): link is NormalizedLink => Boolean(link));
}

function inferTaskFamily(category: string | null, platforms: string[], links: NormalizedLink[]): TaskFamily {
  if (category === "social_post" || category === "carousel") return "social";
  if (BLOG_CATEGORIES.has(category || "")) return "blog";
  if (platforms.some((platform) => SOCIAL_PLATFORMS.has(platform))) return "social";
  if (platforms.some((platform) => BLOG_SOURCE_PLATFORMS.has(platform))) return "blog";
  if (links.some((link) => link.isBlogLike)) return "blog";
  return "other";
}

function badgeForPlatform(platform: string) {
  const meta = PLATFORM_META[platform];
  if (!meta) return null;
  return (
    <span
      key={platform}
      title={meta.label}
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", meta.badge)}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

function chunkIntoParagraphs(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 5) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    chunks.push(sentences.slice(i, i + 3).join(" "));
  }
  return chunks;
}

function renderArticleContent(text: string): ReactNode[] {
  const clean = stripHtml(text);
  if (!clean) return [];

  const blocks = clean.includes("\n")
    ? clean.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)
    : chunkIntoParagraphs(clean);

  const nodes: ReactNode[] = [];

  blocks.forEach((block, index) => {
    if (/^#{1,6}\s/.test(block)) {
      nodes.push(
        <h3 key={`heading-${index}`} className="text-lg font-semibold text-foreground">
          {block.replace(/^#{1,6}\s*/, "")}
        </h3>
      );
      return;
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const isList = lines.length > 1 && lines.every((line) => /^[-•*]\s|^\d+[.)]\s/.test(line));
    if (isList) {
      nodes.push(
        <ul key={`list-${index}`} className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/90">
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{line.replace(/^[-•*]\s+/, "").replace(/^\d+[.)]\s+/, "")}</li>
          ))}
        </ul>
      );
      return;
    }

    if (block.length < 90 && !/[.!?]$/.test(block) && /[A-Za-zÀ-ÿ]{4,}/.test(block)) {
      nodes.push(
        <h4 key={`subheading-${index}`} className="text-base font-semibold text-foreground">
          {block}
        </h4>
      );
      return;
    }

    nodes.push(
      <p key={`paragraph-${index}`} className="text-sm leading-7 text-foreground/90">
        {block}
      </p>
    );
  });

  return nodes;
}

export function TaskItem({ task, agentHrefPrefix }: {
  task: TaskForDisplay;
  agentHrefPrefix?: "/admin/agents" | "/client/agents";
}) {
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.completed;
  const StatusIcon = statusCfg.icon;
  const cat = task.category || "other";

  let dd: DeliverableData = {};
  try {
    dd = JSON.parse(task.deliverableData || "{}");
  } catch {}

  const images = dd.images || [];
  const normalizedLinks = normalizeLinks(dd.links);
  const normalizedPlatforms = Array.from(new Set((dd.platforms || []).map(normalizePlatform).filter(Boolean)));
  const content = stripHtml(dd.content || dd.caption || "");
  const scheduledDate = dd.scheduledDate;
  const family = inferTaskFamily(task.category, normalizedPlatforms, normalizedLinks);
  const isBlog = family === "blog";
  const isSocial = family === "social";
  const blogSourcePlatforms = normalizedPlatforms.filter((platform) => BLOG_SOURCE_PLATFORMS.has(platform));
  const destinationPlatforms = normalizedPlatforms.filter((platform) => SOCIAL_PLATFORMS.has(platform));
  const relatedLinks = isSocial ? normalizedLinks.filter((link) => link.isBlogLike) : normalizedLinks;
  const destinationLinks = isSocial ? normalizedLinks.filter((link) => !link.isBlogLike) : [];
  const hasDeliverables = images.length > 0 || normalizedLinks.length > 0 || content.length > 0;
  const previewText = content.replace(/\s+/g, " ").trim().slice(0, 260);
  const collapsedPrimaryLink = isBlog
    ? relatedLinks[0]
    : destinationLinks[0];
  const articleNodes = isBlog ? renderArticleContent(content) : [];

  // Completed tasks with deliverables show content directly (no collapse)
  const showDirectly = task.status === 'completed' && hasDeliverables;

  return (
    <li className="group rounded-xl border border-border bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card">
      <details open={showDirectly}>
        <summary className={cn("list-none cursor-pointer px-5 py-4", showDirectly && "cursor-default")}>
          <div className="flex items-start gap-3">
            <StatusIcon className={cn("mt-0.5 h-4 w-4 shrink-0", statusCfg.color)} aria-hidden />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">{task.title}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                    CATEGORY_COLORS[cat]
                  )}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </span>

                {isBlog && blogSourcePlatforms.length > 0 && blogSourcePlatforms.map(badgeForPlatform)}
                {isSocial && destinationPlatforms.length > 0 && destinationPlatforms.map(badgeForPlatform)}
                {!isBlog && !isSocial && normalizedPlatforms.map(badgeForPlatform)}

                {hasDeliverables && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary group-open:hidden">
                    Ver conteúdo
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{formatShort(task.startedAt)}</span>
                {task.resolvedAt && (
                  <>
                    <span>→</span>
                    <span>{formatShort(task.resolvedAt)}</span>
                  </>
                )}
                {scheduledDate && (
                  <>
                    <span>•</span>
                    <span>Agendado: {scheduledDate}</span>
                  </>
                )}
                {task.agent && agentHrefPrefix && (
                  <Link
                    href={`${agentHrefPrefix}/${task.agent.agentId}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {task.agent.name}
                  </Link>
                )}
              </div>

              {previewText && (
                <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                  {previewText}
                </p>
              )}

              {collapsedPrimaryLink && (
                <div className="mt-2">
                  <a
                    href={collapsedPrimaryLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium hover:bg-accent"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {collapsedPrimaryLink.label}
                  </a>
                </div>
              )}

              {images.length > 0 && (
                <div className="mt-2 flex gap-1 group-open:hidden">
                  {images.slice(0, 4).map((img, index) => (
                    <img
                      key={index}
                      src={toUrl(img)}
                      alt={toAlt(img)}
                      className="h-14 w-14 rounded object-cover opacity-80"
                      loading="lazy"
                    />
                  ))}
                  {images.length > 4 && (
                    <span className="flex h-14 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                      +{images.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180")} />
          </div>
        </summary>

        {hasDeliverables ? (
          <div className="space-y-5 border-t border-border bg-background/50 px-5 py-4">
            {isSocial && destinationPlatforms.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Publicado em</h4>
                <div className="flex flex-wrap gap-2">
                  {destinationPlatforms.map(badgeForPlatform)}
                </div>
              </div>
            )}

            {isBlog && blogSourcePlatforms.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Origem do blog</h4>
                <div className="flex flex-wrap gap-2">
                  {blogSourcePlatforms.map(badgeForPlatform)}
                </div>
              </div>
            )}

            {images.length > 0 ? (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {cat === "carousel" ? "Slides" : isSocial ? "Mídia do post" : "Capa e mídia"}
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((img, index) => (
                    <a
                      key={index}
                      href={toUrl(img)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-border transition-colors hover:border-primary/50"
                    >
                      <img
                        src={toUrl(img)}
                        alt={toAlt(img, `Slide ${index + 1}`)}
                        className="block aspect-[4/5] w-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {content.length > 0 ? (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {isBlog ? "Conteúdo completo" : isSocial ? "Legenda / copy" : "Descrição"}
                </h4>

                {isBlog ? (
                  <div className="space-y-4 rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
                    {articleNodes.length > 0 ? articleNodes : (
                      <p className="text-sm leading-7 text-foreground/90">{content}</p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground/90">
                      {content}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {destinationLinks.length > 0 ? (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Links do post</h4>
                <div className="flex flex-wrap gap-2">
                  {destinationLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {relatedLinks.length > 0 ? (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {isSocial ? "Artigo relacionado" : "Links do blog"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {relatedLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
            Sem conteúdo detalhado registrado.
          </div>
        )}
      </details>
    </li>
  );
}
