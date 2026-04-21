import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function secret() {
  return "ocs_" + randomBytes(24).toString("base64url");
}

async function main() {
  console.log("🌱  Seeding OpenClaw Dashboard...");

  const lucasTenant = await prisma.tenant.upsert({
    where: { slug: "dantas-labs" },
    update: {},
    create: {
      slug: "dantas-labs",
      name: "Dantas Labs",
      description: "Tenant pessoal do Lucas — agentes internos e experimentos.",
    },
  });

  const acme = await prisma.tenant.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      slug: "acme",
      name: "Acme Corp",
      description: "Cliente demo — suporte e vendas via WhatsApp.",
    },
  });

  const initech = await prisma.tenant.upsert({
    where: { slug: "initech" },
    update: {},
    create: {
      slug: "initech",
      name: "Initech",
      description: "Cliente demo — automação de dev/ops com agentes GitHub.",
    },
  });

  const passwordHash = await bcrypt.hash("changeme", 10);

  const lucas = await prisma.user.upsert({
    where: { email: "lucas.odantas@gmail.com" },
    update: { isAdmin: true, name: "Lucas Dantas" },
    create: {
      email: "lucas.odantas@gmail.com",
      name: "Lucas Dantas",
      passwordHash,
      isAdmin: true,
    },
  });

  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: lucas.id, tenantId: lucasTenant.id } },
    update: {},
    create: { userId: lucas.id, tenantId: lucasTenant.id },
  });

  // Agentes de exemplo
  const agents = [
    {
      agentId: "lucas-ops-01",
      name: "Lucas Ops",
      tenantId: lucasTenant.id,
      persona: "Agente pessoal de ops, lida com GitHub e tarefas diárias.",
      status: "online",
      model: "claude-opus-4-7",
    },
    {
      agentId: "acme-wa-support-01",
      name: "Acme Support WA",
      tenantId: acme.id,
      persona: "Atendimento WhatsApp Acme, triagem de tickets.",
      status: "online",
      model: "claude-sonnet-4-6",
    },
    {
      agentId: "acme-sales-01",
      name: "Acme Sales",
      tenantId: acme.id,
      persona: "Vendas consultivas, qualificação de leads.",
      status: "offline",
      model: "claude-sonnet-4-6",
    },
    {
      agentId: "initech-github-bot",
      name: "Initech GitHub Bot",
      tenantId: initech.id,
      persona: "Revisa PRs, abre issues a partir de falhas de CI.",
      status: "online",
      model: "claude-opus-4-7",
    },
  ];

  for (const a of agents) {
    await prisma.agent.upsert({
      where: { agentId: a.agentId },
      update: a,
      create: { ...a, heartbeatSecret: secret() },
    });
  }

  // Backfill: qualquer agente sem heartbeatSecret recebe um novo
  const missing = await prisma.agent.findMany({
    where: { heartbeatSecret: null },
    select: { id: true },
  });
  for (const a of missing) {
    await prisma.agent.update({
      where: { id: a.id },
      data: { heartbeatSecret: secret() },
    });
  }

  // Exemplo de integração GitHub para lucas-ops-01
  const lucasOps = await prisma.agent.findUnique({
    where: { agentId: "lucas-ops-01" },
  });
  if (lucasOps) {
    const gh = await prisma.githubIntegration.upsert({
      where: { agentId: lucasOps.id },
      update: {},
      create: {
        agentId: lucasOps.id,
        mode: "gh-cli",
        scope: "prs",
        org: "iamlucasdantas",
        defaultBranch: "main",
        tokenPreview: "a1b2",
      },
    });
    const repos = [
      { owner: "iamlucasdantas", name: "openclaw-dashboard", role: "admin" },
      { owner: "iamlucasdantas", name: "openclaw", role: "write" },
    ];
    for (const r of repos) {
      await prisma.githubRepo.upsert({
        where: {
          integrationId_owner_name: {
            integrationId: gh.id,
            owner: r.owner,
            name: r.name,
          },
        },
        update: {},
        create: { ...r, integrationId: gh.id },
      });
    }
  }

  // Custos fake: 30 dias de uso por agente, volume e perfil por agente.
  const existingEvents = await prisma.usageEvent.count();
  if (existingEvents === 0) {
    const allAgents = await prisma.agent.findMany();
    const MODEL_RATES: Record<string, { in: number; out: number }> = {
      "claude-opus-4-7": { in: 15 / 1e6, out: 75 / 1e6 },
      "claude-sonnet-4-6": { in: 3 / 1e6, out: 15 / 1e6 },
      "claude-haiku-4-5-20251001": { in: 1 / 1e6, out: 5 / 1e6 },
    };

    const bulk: any[] = [];
    for (const a of allAgents) {
      const model = a.model && MODEL_RATES[a.model] ? a.model : "claude-sonnet-4-6";
      const rate = MODEL_RATES[model];
      // perfil: "ops" + "opus" → mais caro; suporte → alto volume; vendas → médio
      const base = a.agentId.includes("ops") ? 6 : a.agentId.includes("support") ? 40 : 15;
      for (let d = 29; d >= 0; d--) {
        const day = new Date();
        day.setHours(12, 0, 0, 0);
        day.setDate(day.getDate() - d);
        const calls = Math.round(base * (0.6 + Math.random() * 0.8));
        for (let i = 0; i < calls; i++) {
          const inputTokens = 400 + Math.floor(Math.random() * 2000);
          const outputTokens = 80 + Math.floor(Math.random() * 800);
          const costUsd = inputTokens * rate.in + outputTokens * rate.out;
          const occurredAt = new Date(day);
          occurredAt.setMinutes(Math.floor(Math.random() * 60 * 14));
          bulk.push({
            agentId: a.id,
            model,
            inputTokens,
            outputTokens,
            costUsd,
            occurredAt,
          });
        }
      }
    }
    if (bulk.length > 0) {
      await prisma.usageEvent.createMany({ data: bulk });
    }
    console.log(`   • UsageEvents seeded: ${bulk.length}`);
  }

  // Catálogo global de skills
  const skillCatalog = [
    {
      slug: "gmail",
      name: "Gmail",
      category: "integration",
      description: "Leitura/envio de emails via Gmail API.",
      source: "clawhub",
      version: "1.2.0",
    },
    {
      slug: "google-calendar",
      name: "Google Calendar",
      category: "integration",
      description: "Criar, listar e atualizar eventos.",
      source: "clawhub",
      version: "0.9.0",
    },
    {
      slug: "github-ops",
      name: "GitHub Ops",
      category: "integration",
      description: "Issues, PRs e reviews via gh CLI ou MCP.",
      source: "clawhub",
      version: "2.0.1",
    },
    {
      slug: "slack-inbound",
      name: "Slack Inbound",
      category: "integration",
      description: "Recebe mensagens e menções em canais Slack.",
      source: "clawhub",
      version: "1.0.0",
    },
    {
      slug: "whatsapp-cloud",
      name: "WhatsApp Cloud",
      category: "integration",
      description: "Envio/recebimento via WhatsApp Cloud API.",
      source: "clawhub",
      version: "1.4.2",
    },
    {
      slug: "ci-alerts",
      name: "CI Alerts",
      category: "utility",
      description: "Abre issue quando um workflow falha.",
      source: "local",
      version: "0.3.0",
    },
    {
      slug: "react-loop",
      name: "ReAct Loop",
      category: "llm",
      description: "Loop ReAct com tool calling padrão.",
      source: "local",
      version: "3.1.0",
    },
    {
      slug: "memory-kv",
      name: "Memory KV",
      category: "utility",
      description: "Armazenamento chave-valor de memória longa.",
      source: "local",
      version: "1.0.0",
    },
  ];
  for (const s of skillCatalog) {
    await prisma.skill.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }

  // Instalar algumas skills nos agentes seedados
  const lucasOpsAgent = await prisma.agent.findUnique({
    where: { agentId: "lucas-ops-01" },
  });
  const acmeSupport = await prisma.agent.findUnique({
    where: { agentId: "acme-wa-support-01" },
  });
  const initechBot = await prisma.agent.findUnique({
    where: { agentId: "initech-github-bot" },
  });
  const getSkill = (slug: string) => prisma.skill.findUnique({ where: { slug } });

  const seedAgentSkill = async (
    agentDbId: string | undefined,
    skillSlug: string,
    enabled = true
  ) => {
    if (!agentDbId) return;
    const sk = await getSkill(skillSlug);
    if (!sk) return;
    await prisma.agentSkill.upsert({
      where: { agentId_skillId: { agentId: agentDbId, skillId: sk.id } },
      update: { enabled },
      create: { agentId: agentDbId, skillId: sk.id, enabled },
    });
  };

  await seedAgentSkill(lucasOpsAgent?.id, "github-ops");
  await seedAgentSkill(lucasOpsAgent?.id, "memory-kv");
  await seedAgentSkill(lucasOpsAgent?.id, "react-loop");
  await seedAgentSkill(acmeSupport?.id, "whatsapp-cloud");
  await seedAgentSkill(acmeSupport?.id, "react-loop");
  await seedAgentSkill(acmeSupport?.id, "memory-kv", false);
  await seedAgentSkill(initechBot?.id, "github-ops");
  await seedAgentSkill(initechBot?.id, "ci-alerts");

  // Exemplos de cron
  const seedCron = async (
    agentDbId: string | undefined,
    data: {
      name: string;
      schedule: string;
      command: string;
      state?: string;
      lastRunStatus?: string;
    }
  ) => {
    if (!agentDbId) return;
    const existing = await prisma.agentCron.findFirst({
      where: { agentId: agentDbId, name: data.name },
    });
    if (existing) return;
    await prisma.agentCron.create({
      data: {
        agentId: agentDbId,
        ...data,
        lastRunAt: data.lastRunStatus ? new Date(Date.now() - 60 * 60 * 1000) : null,
      },
    });
  };

  await seedCron(lucasOpsAgent?.id, {
    name: "Revisar PRs abertos",
    schedule: "*/30 * * * *",
    command: "skill:github-ops review-open-prs",
    state: "active",
    lastRunStatus: "ok",
  });
  await seedCron(lucasOpsAgent?.id, {
    name: "Resumo diário de issues",
    schedule: "0 9 * * *",
    command: "skill:github-ops daily-issue-digest",
    state: "active",
    lastRunStatus: "ok",
  });
  await seedCron(initechBot?.id, {
    name: "Abrir issue em falha de CI",
    schedule: "@hourly",
    command: "skill:ci-alerts on-failure",
    state: "paused",
    lastRunStatus: "error",
  });
  await seedCron(acmeSupport?.id, {
    name: "Relatório semanal de atendimento",
    schedule: "0 8 * * 1",
    command: "prompt:generate-weekly-report",
    state: "active",
  });

  // Histórico de atividades de skills (amostra legível)
  const existingActivities = await prisma.skillActivity.count();
  if (existingActivities === 0) {
    const installs = await prisma.agentSkill.findMany({
      include: { skill: true, agent: true },
    });

    type Sample = {
      summary: string;
      body?: string;
      contentType?: "text" | "image" | "link";
      contentUrl?: string;
    };

    const samples: Record<string, Sample[]> = {
      gmail: [
        {
          summary: "Respondeu email de Ana Silva",
          contentType: "text",
          body:
            "Oi Ana,\n\nObrigado pelo retorno! Agendei nossa próxima call para " +
            "quinta-feira às 14h. Enviei o convite pelo Calendar.\n\n" +
            "Qualquer coisa me avise.\n\n— Lucas",
        },
        {
          summary: "Enviou atualização para cliente Acme",
          contentType: "text",
          body:
            "Olá time Acme,\n\nStatus dos deploys desta semana:\n" +
            "• app-web: v2.4.1 em produção ✓\n" +
            "• worker: v1.8.0 em staging aguardando QA\n" +
            "• dashboard: correções de UX na próxima release\n\n" +
            "Abraço.",
        },
        {
          summary: "Marcou 12 mensagens como lidas",
          contentType: "text",
          body: "Limpeza automática do inbox — 12 emails de newsletters e bounces.",
        },
      ],
      "google-calendar": [
        {
          summary: "Criou evento 'Reunião de alinhamento'",
          contentType: "text",
          body:
            "Evento criado:\n" +
            "• Título: Reunião de alinhamento\n" +
            "• Quando: Quarta, 14:00–15:00\n" +
            "• Participantes: lucas@, ana@, carlos@\n" +
            "• Link: Google Meet gerado",
        },
        {
          summary: "Moveu compromisso 'Planning' para quinta às 16h",
          contentType: "text",
          body: "Remarcado de quarta 10h → quinta 16h. Notificação enviada para os 4 participantes.",
        },
      ],
      "github-ops": [
        {
          summary: "Revisou PR #142 em openclaw-dashboard",
          contentType: "link",
          contentUrl: "https://github.com/iamlucasdantas/openclaw-dashboard/pull/142",
          body:
            "Aprovado com sugestões:\n" +
            "✓ Lógica de heartbeat está correta\n" +
            "✓ Isolamento por tenant verificado\n" +
            "⚠ Falta tratamento de rate-limit na API pública\n" +
            "⚠ Sugeriria adicionar teste para path 401",
        },
        {
          summary: "Abriu issue 'Falha no workflow ci.yml'",
          contentType: "link",
          contentUrl: "https://github.com/iamlucasdantas/openclaw-dashboard/issues/77",
          body:
            "Detectei falha no último run do ci.yml:\n\n" +
            "```\nError: Cannot find module 'zod' at ...\n```\n\n" +
            "Parece que a instalação de dependências falhou em Node 18 na etapa de lint. Reproduzir local passo-a-passo...",
        },
        {
          summary: "Comentou em PR #98",
          contentType: "link",
          contentUrl: "https://github.com/iamlucasdantas/openclaw-dashboard/pull/98",
          body: "Checar se o schema de AuditLog comporta metadata extenso (JSON stringified pode ficar grande em SQLite).",
        },
      ],
      "slack-inbound": [
        {
          summary: "Respondeu menção em #suporte",
          contentType: "text",
          body:
            "@carlos você pode tentar limpar o cache local com:\n\n" +
            "`rm -rf .next && npm run dev`\n\n" +
            "Se persistir, me chama em DM com o log do console.",
        },
        {
          summary: "Processou mensagem direta de @marina",
          contentType: "text",
          body: "Marina pediu para gerar relatório de vendas do Q1. Encaminhei para o skill de exports.",
        },
      ],
      "whatsapp-cloud": [
        {
          summary: "Respondeu cliente @acme no WhatsApp",
          contentType: "text",
          body:
            "Oi! Seu pedido #4521 foi despachado hoje de manhã. " +
            "Código de rastreio: BR123456789BR. " +
            "Prazo estimado: 2 dias úteis. Qualquer coisa, tô aqui. 👋",
        },
        {
          summary: "Enviou imagem de confirmação de pagamento",
          contentType: "image",
          contentUrl: "https://picsum.photos/seed/payment/600/400",
          body: "Comprovante de pagamento enviado automaticamente após confirmação do Stripe webhook.",
        },
        {
          summary: "Encaminhou chamado para time humano",
          contentType: "text",
          body: "Cliente solicitou reembolso fora da política automática — escalado para atendimento humano com contexto completo.",
        },
      ],
      "ci-alerts": [
        {
          summary: "Detectou falha no workflow deploy.yml",
          contentType: "link",
          contentUrl:
            "https://github.com/iamlucasdantas/openclaw-dashboard/actions/runs/9876543",
          body:
            "Run falhou na etapa de build com:\n\n" +
            "```\nError: Build optimization failed\n  at compile (webpack.js:412:15)\n```\n\n" +
            "Abrindo issue automaticamente.",
        },
        {
          summary: "Abriu issue automática por CI",
          contentType: "link",
          contentUrl:
            "https://github.com/iamlucasdantas/openclaw-dashboard/issues/88",
          body: "Issue #88 criada com logs do run falho e stack trace. Atribuído para o time de infra.",
        },
      ],
      "react-loop": [
        {
          summary: "Resolveu tarefa 'gerar post LinkedIn' em 4 etapas",
          contentType: "text",
          body:
            "Passos executados:\n" +
            "1. Buscou contexto do produto (skill:memory-kv)\n" +
            "2. Gerou rascunho com tom inspiracional\n" +
            "3. Revisou para remover jargão técnico\n" +
            "4. Entregou ao cliente para aprovação\n\n" +
            "Conteúdo final:\n\n---\n\n" +
            "\"A verdadeira inovação começa quando paramos de otimizar o passado " +
            "e passamos a projetar o futuro. Hoje nosso agente lançou a v2.0 e " +
            "isso é só o começo. 🚀\"\n\n#ia #agentes #openclaw",
        },
        {
          summary: "Chamou ferramenta search 3x para responder pergunta",
          contentType: "text",
          body:
            "Query do usuário: 'qual foi o melhor trimestre em vendas'.\n\n" +
            "Busquei em 3 fontes (CRM, planilha, relatório Q-anterior). " +
            "Resposta consolidada: Q3 2025 teve 187% do target, puxado por " +
            "entrada de 4 contas enterprise.",
        },
      ],
      "memory-kv": [
        {
          summary: "Salvou preferência do usuário",
          contentType: "text",
          body:
            "Chave: user.preferences.tone\n" +
            "Valor: 'informal e direto'\n" +
            "Origem: mensagem do usuário em 18/04 às 10:15",
        },
        {
          summary: "Recuperou contexto da sessão anterior",
          contentType: "text",
          body: "Carregou 24 chaves de memória longa: perfil do cliente, preferências, últimos 5 tópicos discutidos.",
        },
      ],
    };

    const statusPool = ["ok", "ok", "ok", "ok", "ok", "warning", "error"];
    const bulk: any[] = [];

    for (const install of installs) {
      const list = samples[install.skill.slug] ?? [
        { summary: "Executou ação", body: "Sem detalhes disponíveis." },
      ];
      const count = 10 + Math.floor(Math.random() * 20);

      for (let i = 0; i < count; i++) {
        const pick = list[Math.floor(Math.random() * list.length)];
        const status = statusPool[Math.floor(Math.random() * statusPool.length)];
        const daysAgo = Math.floor(Math.random() * 30); // 30 dias de janela
        const occurredAt = new Date();
        occurredAt.setHours(7 + Math.floor(Math.random() * 15));
        occurredAt.setMinutes(Math.floor(Math.random() * 60));
        occurredAt.setSeconds(Math.floor(Math.random() * 60));
        occurredAt.setDate(occurredAt.getDate() - daysAgo);

        bulk.push({
          agentSkillId: install.id,
          summary: pick.summary,
          body: pick.body ?? null,
          contentType: pick.contentType ?? null,
          contentUrl: pick.contentUrl ?? null,
          status,
          occurredAt,
        });
      }
    }
    if (bulk.length > 0) {
      await prisma.skillActivity.createMany({ data: bulk });
    }
    console.log(`   • SkillActivities seeded: ${bulk.length}`);
  }

  // Limites de custo
  const acmeTenant = await prisma.tenant.findUnique({ where: { slug: "acme" } });
  if (acmeTenant && acmeTenant.monthlyBudgetUsd == null) {
    await prisma.tenant.update({
      where: { id: acmeTenant.id },
      data: { monthlyBudgetUsd: 100 },
    });
  }
  if (acmeSupport) {
    await prisma.agent.update({
      where: { id: acmeSupport.id },
      data: { monthlyBudgetUsd: 60 },
    });
  }

  // Exemplo de campanha de prospecção no tenant Dantas Labs
  const existingCampaigns = await prisma.prospectingCampaign.count();
  if (existingCampaigns === 0 && lucasTenant) {
    const campaign = await prisma.prospectingCampaign.create({
      data: {
        tenantId: lucasTenant.id,
        name: "Salões em Curitiba",
        state: "active",
        ghlLocationId: "demoLoc_dantas_labs",
        ghlApiKey: "pit-demo-xxxxxxxx",
        ghlApiKeyHint: "xxxx",
        areaLabel: "Curitiba - PR",
        radiusKm: 10,
        niches: JSON.stringify([
          "Salões de beleza",
          "Barbearias",
          "Clínicas de estética",
        ]),
        filters: JSON.stringify({
          gbp: true,
          website: true,
          social: false,
          email: true,
          phone: true,
        }),
        fieldMap: JSON.stringify({
          businessName: "companyName",
          contactName: "firstName",
          contactEmail: "email",
          contactPhone: "phone",
          address: "address1",
          city: "city",
          state: "state",
          websiteUrl: "website",
          gbpUrl: "gbp_url",
          instagramUrl: "instagram",
          niche: "niche",
        }),
        schedule: "daily",
        scheduleTime: "09:00",
        nextRunAt: (() => {
          const d = new Date();
          d.setHours(9, 0, 0, 0);
          if (d <= new Date()) d.setDate(d.getDate() + 1);
          return d;
        })(),
        autoExpand: true,
        expandAfterDays: 3,
        expandStepKm: 5,
        maxRadiusKm: 50,
      },
    });

    // Gera leads fake pra já vir com conteúdo
    const niches = ["Salões de beleza", "Barbearias", "Clínicas de estética"];
    const samples = [
      "Studio Beleza & Cia",
      "Salão Rosa",
      "Barbearia do João",
      "Casa de Cílios",
      "Espaço Tranquilidade",
      "Beleza Natural",
      "Estilo Corte",
      "Charme Salão",
      "Bela Vida",
      "Toque Final",
    ];
    for (let i = 0; i < samples.length; i++) {
      const niche = niches[i % niches.length];
      const rollStatus = Math.random();
      const status = rollStatus < 0.6 ? "synced" : rollStatus < 0.85 ? "pending" : "error";
      const slug = samples[i].toLowerCase().replace(/\s+/g, "-").replace(/&/g, "e");
      await prisma.prospectingLead.create({
        data: {
          campaignId: campaign.id,
          businessName: samples[i],
          niche,
          address: `Rua dos Pinhais, ${100 + i * 20}`,
          city: "Curitiba",
          state: "PR",
          websiteUrl: Math.random() > 0.2 ? `https://${slug}.com.br` : null,
          gbpUrl: `https://g.page/${slug}`,
          instagramUrl:
            Math.random() > 0.3 ? `https://instagram.com/${slug}` : null,
          contactName: ["Ana Silva", "Carlos Lima", "Marina Costa", "João Santos"][
            i % 4
          ],
          contactEmail: `contato@${slug}.com.br`,
          contactPhone: `(41) 9${Math.floor(8000 + Math.random() * 1999)}-${Math.floor(
            1000 + Math.random() * 8999
          )}`,
          syncStatus: status,
          ghlContactId:
            status === "synced"
              ? "mock_" + Math.random().toString(36).slice(2, 10)
              : null,
          syncedAt: status === "synced" ? new Date() : null,
          syncError:
            status === "error" ? "Falha ao criar contato na HighLevel (mock)" : null,
        },
      });
    }
    console.log(`   • ProspectingCampaign criada com ${samples.length} leads fake`);
  }

  console.log("✅  Seed concluído:");
  console.log(`   • Tenants:     ${await prisma.tenant.count()}`);
  console.log(`   • Users:       ${await prisma.user.count()}`);
  console.log(`   • Agents:      ${await prisma.agent.count()}`);
  console.log(`   • Skills:      ${await prisma.skill.count()}`);
  console.log(`   • AgentSkills: ${await prisma.agentSkill.count()}`);
  console.log(`   • Crons:       ${await prisma.agentCron.count()}`);
  console.log(`   • Events:      ${await prisma.usageEvent.count()}`);
  console.log(`   • Campaigns:   ${await prisma.prospectingCampaign.count()}`);
  console.log(`   • Leads:       ${await prisma.prospectingLead.count()}`);
  console.log("");
  console.log("   Login: lucas.odantas@gmail.com  /  senha: changeme");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
