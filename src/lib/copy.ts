// Copy centralizado do painel — PT-BR.
// Divide entre camada admin (pode vazar jargão técnico) e camada cliente
// (vocabulário de negócio: "assistente", "tarefa", "faturamento").
// "Eugênio" é a persona genérica usada em empty states / onboarding.
//
// Uso:
//   import { copy, t } from "@/lib/copy";
//   <h1>{copy.agent.detail.tabs.summary}</h1>
//   <p>{t(copy.agent.detail.subtitles.activity, { assistantName: "Axxion" })}</p>

export const copy = {
  brand: {
    name: "OpenClaw",
    tagline: "O painel dos seus assistentes",
    assistantPersona: "Eugênio",
  },

  // Navegação
  nav: {
    client: {
      home: "Início",
      agents: "Meus assistentes",
      schedule: "Agenda",
      costs: "Faturamento",
      profile: "Minha conta",
    },
    admin: {
      overview: "Visão geral",
      tenants: "Clientes",
      agents: "Agentes",
      github: "GitHub",
      skills: "Habilidades",
      crons: "Agendamentos",
      costs: "Custos",
      users: "Usuários",
      invites: "Convites",
      audit: "Auditoria",
    },
  },

  // Status semântico do assistente — cliente vê esses rótulos,
  // admin pode continuar vendo os nomes técnicos.
  status: {
    working: {
      label: "Trabalhando normalmente",
      hint: "Tudo certo por aqui.",
    },
    quiet: {
      label: "Quieto no momento",
      hint: "Sem tarefa agendada recente.",
    },
    attention: {
      label: "Precisa de atenção",
      hint: "Algo falhou na última execução.",
    },
    stopped: {
      label: "Parado",
      hint: "Não tive notícias do seu assistente nos últimos minutos.",
    },
  },

  // Tela do assistente
  agent: {
    detail: {
      tabs: {
        summary: "Resumo",
        activity: "O que ele fez",
        connections: "Conexões",
        advanced: "Modo desenvolvedor",
      },
      subtitles: {
        summary: "Como seu assistente está agora",
        activity: "Últimas coisas que o {assistantName} fez por você",
        connections: "Onde o {assistantName} pode atuar",
        advanced: "Área técnica — só se precisar integrar no código",
      },
    },
    actions: {
      edit: "Editar assistente",
      pause: "Pausar assistente",
      resume: "Reativar assistente",
      delete: "Desligar assistente",
    },
    deleteConfirm: {
      title: "Desligar o assistente {name}?",
      body:
        "Isso vai parar todas as tarefas agendadas, cortar as integrações " +
        "e apagar o histórico de 30 dias. Esta ação não pode ser desfeita.",
      typeToConfirm: "Para confirmar, digite o nome do assistente:",
      cta: "Sim, desligar {name}",
      cancel: "Manter ativo",
    },
  },

  // Agendamento (sem cron na superfície)
  schedule: {
    noun: "tarefa agendada",
    page: {
      title: "Agenda",
      subtitle: "Tudo que seus assistentes vão executar nos próximos dias.",
    },
    wizard: {
      title: "Agendar uma tarefa",
      steps: ["O que fazer", "Quando", "Confirmar"],
      frequency: {
        once: {
          label: "Uma vez",
          description: "Roda em uma data específica e pronto.",
        },
        daily: {
          label: "Todo dia",
          description: "Escolha o horário; roda diariamente.",
        },
        weekly: {
          label: "Toda semana",
          description: "Escolha dias da semana e horário.",
        },
        monthly: {
          label: "Todo mês",
          description: "Escolha o dia do mês e o horário.",
        },
        custom: {
          label: "Intervalo personalizado",
          description: "A cada X minutos ou horas.",
        },
      },
      preview: "Vai rodar {humanSchedule}, a partir de {startDate}.",
    },
  },

  // Custos (visão cliente, com loss aversion e BRL)
  costs: {
    header: {
      title: "Faturamento",
      subtitle: "Quanto seus assistentes usaram e o que está previsto.",
    },
    cards: {
      spent: "Você gastou {value} este mês",
      projection: "No ritmo atual, o mês fecha em {value}",
      budget: "Limite definido: {value}",
      unlimited: "Sem limite definido",
    },
    alerts: {
      warn: "Você já usou {pct}% do seu limite mensal.",
      critical: "Atenção: você passou do limite este mês.",
      none: "Dentro do previsto.",
    },
    topAgents: {
      title: "Quem está trabalhando mais",
      empty: "Ainda sem uso neste mês.",
    },
    history: {
      title: "Últimos dias",
    },
  },

  // Empty states
  empty: {
    home: {
      firstAssistant: {
        title: "Conheça o Eugênio, seu primeiro assistente",
        body:
          "O Eugênio pode postar no Google Business Profile, mandar SMS, " +
          "responder no WhatsApp, revisar no GitHub. Vamos criar um em " +
          "2 minutos — sem precisar programar nada.",
        cta: "Criar meu primeiro assistente",
      },
    },
    agents: {
      title: "Nenhum assistente por aqui ainda",
      body: "Crie um assistente pra cuidar de uma rotina repetitiva.",
      cta: "Criar assistente",
    },
    github: {
      title: "Seus assistentes ainda não conversam com o GitHub",
      body:
        "Conectar ao GitHub deixa um assistente abrir issues, revisar código " +
        "e responder pull requests automaticamente. Útil se você tem um " +
        "repositório que o assistente acompanha.",
      ctaPrimary: "Conectar agora",
      ctaSecondary: "Aprender em 2 minutos",
    },
    schedule: {
      title: "Nenhuma tarefa agendada ainda",
      body:
        "Crie um horário fixo pra uma ação repetitiva — por exemplo, publicar " +
        "no Google Business toda quarta às 14h.",
      cta: "Agendar tarefa",
    },
    activity: {
      title: "Ainda sem novidades",
      body:
        "Assim que o assistente fizer algo, aparece aqui com data, hora e o " +
        "conteúdo exato.",
    },
    costs: {
      title: "Nenhum uso registrado ainda",
      body: "Quando seu assistente começar a trabalhar, o consumo aparece aqui.",
    },
  },

  // Ações e botões genéricos
  actions: {
    save: "Salvar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    delete: "Excluir",
    add: "Adicionar",
    edit: "Editar",
    back: "Voltar",
    retry: "Tentar de novo",
    help: "Pedir ajuda",
    learnMore: "Saiba mais",
  },

  // Erros genéricos (cliente)
  errors: {
    generic: {
      title: "Algo deu errado por aqui",
      body: "Já registramos o problema. Você pode tentar de novo ou pedir ajuda.",
    },
    access: {
      title: "Este recurso não pertence à sua conta",
      body: "Se você acha que isso é um erro, entre em contato com o suporte.",
    },
  },
} as const;

// Mini interpolador: substitui {chave} pelos valores passados.
// Mantém tokens não encontrados intactos (não explode silenciosamente).
export function t(
  template: string,
  vars: Record<string, string | number | undefined> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? `{${key}}` : String(v);
  });
}
