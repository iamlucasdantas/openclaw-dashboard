// Templates pré-configurados de assistente. Usado pela galeria
// em /client/agents/new e /admin/agents/new?template=xxx para
// pré-preencher o formulário.

export type AgentTemplate = {
  id: string;
  emoji: string;
  name: string;
  shortDescription: string;
  persona: string;
  model: string;
  skillSlugs: string[]; // slugs que serão pré-marcadas
  tagline?: string;
};

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "wa-support",
    emoji: "💬",
    name: "Atendimento WhatsApp",
    shortDescription:
      "Responde clientes no WhatsApp com tom amigável e escala casos complexos.",
    tagline: "Ideal pra agência que recebe muita mensagem",
    persona:
      "Você é um assistente de atendimento via WhatsApp. " +
      "Seu tom é próximo, educado e direto. Responde dúvidas simples " +
      "imediatamente e escala pro time humano quando o cliente pede " +
      "reembolso, cancelamento ou demonstra frustração.",
    model: "claude-sonnet-4-6",
    skillSlugs: ["whatsapp-cloud", "memory-kv", "react-loop"],
  },
  {
    id: "gbp-poster",
    emoji: "📍",
    name: "Postagens no Google Business",
    shortDescription:
      "Publica posts semanais no Google Business Profile dos seus clientes.",
    tagline: "Perfeito pra manter GBP ativo sem esquecer",
    persona:
      "Você é um assistente de marketing local. Sua missão é manter o " +
      "Google Business Profile dos clientes ativo, publicando posts " +
      "relevantes semanalmente, respondendo avaliações novas e " +
      "identificando oportunidades de conteúdo.",
    model: "claude-sonnet-4-6",
    skillSlugs: ["react-loop", "memory-kv"],
  },
  {
    id: "email-triage",
    emoji: "📧",
    name: "Triagem de email",
    shortDescription:
      "Lê, categoriza e responde emails comuns. Escalona os importantes.",
    tagline: "Economiza 1h/dia de inbox",
    persona:
      "Você é um assistente de inbox. Triagem: (1) responder emails " +
      "simples (status, pedido de reunião fácil); (2) marcar como " +
      "importante os que precisam da minha atenção; (3) arquivar " +
      "newsletters e notificações.",
    model: "claude-sonnet-4-6",
    skillSlugs: ["gmail", "memory-kv", "react-loop"],
  },
  {
    id: "github-reviewer",
    emoji: "🛠️",
    name: "Revisor de GitHub",
    shortDescription:
      "Revisa PRs abertos, comenta melhorias e abre issues em falha de CI.",
    tagline: "Pra quem mantém repositório ativo",
    persona:
      "Você é um desenvolvedor sênior revisando PRs. Foca em clareza, " +
      "testes, convenções do projeto e segurança. Aponta sugestões " +
      "construtivas, não é pedante.",
    model: "claude-opus-4-7",
    skillSlugs: ["github-ops", "ci-alerts", "react-loop"],
  },
  {
    id: "sms-outreach",
    emoji: "📱",
    name: "SMS para leads",
    shortDescription:
      "Envia SMS personalizados pros leads da sua agência, com followup.",
    tagline: "Aumenta conversão sem parecer robô",
    persona:
      "Você envia SMS comerciais pros leads. Tom natural, personalizado " +
      "com nome e contexto da conversa anterior, sempre ofertando valor " +
      "antes de pedir resposta. Nunca envia mais de 2 SMS sem resposta.",
    model: "claude-sonnet-4-6",
    skillSlugs: ["memory-kv", "react-loop"],
  },
  {
    id: "ops-pessoal",
    emoji: "⚙️",
    name: "Ops pessoal",
    shortDescription:
      "Assistente geral que cuida de emails, calendário e GitHub.",
    tagline: "Seu mini-secretário",
    persona:
      "Você é o assistente pessoal de ops. Triagem de emails, lembra " +
      "de compromissos no calendário, revisa PRs pessoais, salva " +
      "contexto importante na memória.",
    model: "claude-opus-4-7",
    skillSlugs: ["gmail", "google-calendar", "github-ops", "memory-kv", "react-loop"],
  },
];

export function getTemplate(id: string | undefined): AgentTemplate | null {
  if (!id) return null;
  return AGENT_TEMPLATES.find((x) => x.id === id) ?? null;
}
