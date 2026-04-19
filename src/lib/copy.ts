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
      integrations: "Integrações",
      schedule: "Agenda",
      costs: "Faturamento",
      profile: "Minha conta",
    },
    admin: {
      overview: "Visão geral",
      tenants: "Clientes",
      agents: "Agentes",
      integrations: "Integrações",
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
    personaFallback: "Este assistente ainda não tem descrição configurada.",
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
      stats: {
        today: "ações hoje",
        week: "ações em 7 dias",
        month: "ações este mês",
      },
      actionsArea: "Ações",
      upcomingTitle: "Próximas tarefas",
      upcomingEmpty: "Nenhuma tarefa agendada nos próximos 7 dias.",
      seeSchedule: "ver agenda completa",
      activity: {
        filtersLabel: "Filtrar:",
        filterToday: "Hoje",
        filter7: "7 dias",
        filter30: "30 dias",
        total: "Total: {n} atividades no período",
        empty: "Nenhuma atividade neste período.",
      },
      connections: {
        skillsTitle: "O que seu assistente sabe fazer",
        skillsSubtitle:
          "Cada habilidade é algo que o assistente executa por você.",
        cronsTitle: "Tarefas agendadas",
        cronsSubtitle: "Rotinas que o assistente roda em horários fixos.",
        githubTitle: "GitHub",
        githubConnected: "Conectado à organização {org}",
        githubConnectedNoOrg: "Conectado ao GitHub",
        githubReposIntro: "Pode atuar em:",
        githubRepoLine: "{owner}/{name} ({role})",
        githubEmpty:
          "O assistente ainda não está conectado ao GitHub. Isso permite abrir issues e PRs automaticamente.",
        manageTechnical: "Abrir detalhes técnicos",
      },
      dev: {
        warning:
          "Área técnica — use apenas se precisar integrar seu assistente ao código. Veja o README pra um passo-a-passo.",
        identifier: "Identificador",
        heartbeatSection: "Conexão técnica (heartbeat)",
        githubSection: "GitHub (metadados técnicos)",
        githubMode: "Modo:",
        githubScope: "Escopo do token:",
        githubBranch: "Branch padrão:",
        githubTokenPreview: "Últimos 4 chars do token:",
      },
    },
    actions: {
      edit: "Editar",
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
      pageTitle: "Agendar uma tarefa",
      stepIndicator: "Passo {current} de {total}",
      steps: {
        task: "O que fazer",
        when: "Quando rodar",
        confirm: "Confirmar",
      },
      subtitles: {
        task: "Diga o nome da tarefa e o que o assistente deve fazer.",
        when: "Escolha com que frequência a tarefa vai rodar.",
        confirm: "Confira os detalhes antes de criar a tarefa.",
      },
      fields: {
        name: "Nome da tarefa",
        namePlaceholder: "Ex: Revisar PRs abertos",
        command: "O que o assistente deve fazer?",
        commandPlaceholder:
          'Ex: "Revisar PRs abertos e me avisar no Slack"',
        commandHint:
          "Descreva em português como se fosse pedir pra uma pessoa.",
      },
      frequency: {
        minutes: {
          label: "A cada X minutos",
          emoji: "⏱️",
          description: "Ex: a cada 15, 30 ou 60 minutos.",
        },
        hourly: {
          label: "De hora em hora",
          emoji: "🕐",
          description: "Roda no minuto 0 de cada hora.",
        },
        daily: {
          label: "Todo dia",
          emoji: "📅",
          description: "No horário que você escolher.",
        },
        weekly: {
          label: "Toda semana",
          emoji: "🗓️",
          description: "Em um dia específico da semana.",
        },
        monthly: {
          label: "Todo mês",
          emoji: "📆",
          description: "Em um dia específico do mês.",
        },
        advanced: {
          label: "Avançado",
          emoji: "🛠️",
          description: "Para quem sabe cron.",
        },
      },
      preview: {
        title: "Prévia",
        natural: "Vai rodar {humanSchedule}.",
        nextRuns: "Próximas execuções:",
      },
      confirm: {
        intro: "O assistente {name} vai executar:",
        firstRun: "Primeira execução: {when}",
        stateLabel: "Estado inicial",
        stateActive: "Ativa (já começa a rodar)",
        statePaused: "Pausada (ligo depois)",
      },
      buttons: {
        next: "Próximo",
        back: "Voltar",
        cancel: "Cancelar",
        create: "Criar tarefa",
      },
      errors: {
        nameRequired: "Dê um nome pra tarefa.",
        commandRequired: "Descreva o que o assistente deve fazer.",
      },
    },
  },

  // Custos (visão cliente, com loss aversion e BRL)
  costs: {
    header: {
      title: "Faturamento",
      subtitle: "Quanto seus assistentes usaram e o que está previsto.",
    },
    cards: {
      spent: "Gasto no mês",
      projection: "Previsão de fechamento",
      projectionHint: "Se manter o ritmo atual",
      limit: "Limite",
      limitUsed: "{pct}% já usado",
      noLimit: "Sem limite definido",
      spent_fallback: "Você gastou {value} este mês",
      unlimited: "Sem limite definido",
    },
    alerts: {
      ok: "Dentro do previsto.",
      warn: "Você já usou {pct}% do seu limite mensal.",
      critical: "Atenção: você passou do limite este mês.",
    },
    whoWorking: {
      title: "Quem está trabalhando mais",
      empty: "Nenhum assistente consumiu neste mês.",
    },
    history: {
      title: "Últimos dias",
      empty: "Sem consumo registrado no período.",
    },
    topAgents: {
      title: "Quem está trabalhando mais",
      empty: "Ainda sem uso neste mês.",
    },
    disclaimer:
      "Valores convertidos de USD a R$ {rate} (cotação aproximada).",
  },

  // Home do cliente (Jobs-to-be-Done)
  home: {
    greeting: {
      morning: "Bom dia, {name}.",
      afternoon: "Boa tarde, {name}.",
      evening: "Boa noite, {name}.",
    },
    headlineAllWorking: {
      one: "Seu assistente está trabalhando normalmente.",
      many: "Seus {count} assistentes estão trabalhando normalmente.",
    },
    headlineSomeAttention: {
      one: "1 assistente precisa de atenção.",
      many: "{count} assistentes precisam de atenção.",
    },
    headlineSomeStopped: {
      one: "1 assistente não deu sinal de vida nos últimos minutos.",
      many: "{count} assistentes não deram sinal de vida nos últimos minutos.",
    },
    headlineAdminBadge: "visão cliente",
    sections: {
      today: "Hoje, {date}",
      todayEmpty: "Nenhuma atividade hoje. Seus assistentes estão descansando.",
      todayAgentIdle: "Nenhuma tarefa agendada pra hoje",
      upcomingTitle: "Próxima tarefa",
      upcomingEmpty: "Nenhuma tarefa nos próximos 7 dias.",
      upcomingLineWhen: "{day}, {time}",
      budgetTitle: "Faturamento do mês",
      budgetSpent: "{spent} gastos",
      budgetOf: "de {budget}",
      budgetProjection: "Previsto fechar em {value}",
      budgetUnlimited: "Sem limite definido.",
      budgetUnlimitedCta: "Definir limite",
      budgetAlertWarn: "Você já usou {pct}% do seu limite.",
      budgetAlertCritical: "Atenção: você passou do limite este mês.",
      myAssistants: "Meus assistentes",
      openAgent: "abrir →",
      seeSchedule: "ver agenda →",
      seeCosts: "ver detalhes →",
      viewIssue: "ver",
    },
    assistantCard: {
      tasksTodayZero: "0 tarefas hoje",
      tasksTodayOne: "1 tarefa hoje",
      tasksTodayMany: "{n} tarefas hoje",
      skillsOne: "1 habilidade",
      skillsMany: "{n} habilidades",
    },
    // Verbos humanizados por skill-slug pra transformar atividades em valor.
    activityVerbs: {
      gmail: {
        one: "respondeu 1 email",
        many: "respondeu {n} emails",
      },
      "google-calendar": {
        one: "criou 1 evento",
        many: "criou {n} eventos",
      },
      "github-ops": {
        one: "revisou 1 PR",
        many: "revisou {n} PRs",
      },
      "slack-inbound": {
        one: "respondeu 1 menção no Slack",
        many: "respondeu {n} menções no Slack",
      },
      "whatsapp-cloud": {
        one: "respondeu 1 cliente no WhatsApp",
        many: "respondeu {n} clientes no WhatsApp",
      },
      "ci-alerts": {
        one: "detectou 1 alerta de CI",
        many: "detectou {n} alertas de CI",
      },
      "react-loop": {
        one: "concluiu 1 raciocínio complexo",
        many: "concluiu {n} raciocínios complexos",
      },
      "memory-kv": {
        one: "salvou 1 memória",
        many: "salvou {n} memórias",
      },
      generic: {
        one: "executou 1 ação",
        many: "executou {n} ações",
      },
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
