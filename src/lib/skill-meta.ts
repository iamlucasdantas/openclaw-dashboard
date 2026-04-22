export type CategoryMeta = {
  slug: string;
  label: string;
  description: string;
  color: string; // tailwind bg color
  emoji: string;
};

export const CATEGORIES: Record<string, CategoryMeta> = {
  integration: {
    slug: "integration",
    label: "Integrações",
    description: "Conecta o agente a apps externos (email, calendário, Slack, WhatsApp…).",
    color: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
    emoji: "🔌",
  },
  llm: {
    slug: "llm",
    label: "LLM / Inteligência",
    description: "Capacidades de raciocínio, memória e loops de pensamento.",
    color: "bg-violet-500/15 text-violet-300 border border-violet-500/20",
    emoji: "🧠",
  },
  utility: {
    slug: "utility",
    label: "Utilidades",
    description: "Ferramentas que o agente usa internamente (memória, alertas…).",
    color: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
    emoji: "🛠️",
  },
  automation: {
    slug: "automation",
    label: "Automações",
    description: "Rotinas e fluxos pré-montados.",
    color: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    emoji: "⚙️",
  },
};

export function catMeta(slug: string): CategoryMeta {
  return (
    CATEGORIES[slug] ?? {
      slug,
      label: slug,
      description: "",
      color: "bg-muted text-muted-foreground",
      emoji: "✨",
    }
  );
}
