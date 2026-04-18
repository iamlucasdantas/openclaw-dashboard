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
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    emoji: "🔌",
  },
  llm: {
    slug: "llm",
    label: "LLM / Inteligência",
    description: "Capacidades de raciocínio, memória e loops de pensamento.",
    color: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    emoji: "🧠",
  },
  utility: {
    slug: "utility",
    label: "Utilidades",
    description: "Ferramentas que o agente usa internamente (memória, alertas…).",
    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    emoji: "🛠️",
  },
  automation: {
    slug: "automation",
    label: "Automações",
    description: "Rotinas e fluxos pré-montados.",
    color: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
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
