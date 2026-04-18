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

    const samples: Record<string, string[]> = {
      gmail: [
        "Respondeu email de {from}",
        "Enviou atualização para cliente {client}",
        "Marcou {n} mensagens como lidas",
      ],
      "google-calendar": [
        "Criou evento 'Reunião de alinhamento'",
        "Aceitou convite de {from}",
        "Moveu compromisso para {day}",
      ],
      "github-ops": [
        "Revisou PR #{n} em {repo}",
        "Abriu issue 'Falha no workflow X'",
        "Comentou em PR #{n}",
      ],
      "slack-inbound": [
        "Respondeu menção em #{channel}",
        "Processou mensagem direta de @{user}",
      ],
      "whatsapp-cloud": [
        "Respondeu cliente {client} no WhatsApp",
        "Encaminhou chamado para time humano",
      ],
      "ci-alerts": [
        "Detectou falha no workflow {workflow}",
        "Abriu issue automática por CI",
      ],
      "react-loop": [
        "Resolveu tarefa em {n} etapas",
        "Chamou ferramenta {tool}",
      ],
      "memory-kv": [
        "Salvou preferência do usuário",
        "Recuperou contexto da sessão anterior",
      ],
    };

    const statusPool = ["ok", "ok", "ok", "ok", "ok", "warning", "error"];
    const bulk: any[] = [];
    for (const install of installs) {
      const list = samples[install.skill.slug] ?? ["Executou ação"];
      const count = 8 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const template = list[Math.floor(Math.random() * list.length)];
        const summary = template
          .replace("{n}", String(1 + Math.floor(Math.random() * 400)))
          .replace("{from}", ["Ana", "Carlos", "Bruno", "Marina"][Math.floor(Math.random() * 4)])
          .replace("{client}", ["@acme", "@initech", "@beta", "@gama"][Math.floor(Math.random() * 4)])
          .replace("{repo}", "iamlucasdantas/openclaw-dashboard")
          .replace("{day}", ["segunda", "terça", "quarta"][Math.floor(Math.random() * 3)])
          .replace("{channel}", ["dev", "suporte", "geral"][Math.floor(Math.random() * 3)])
          .replace("{user}", ["ana", "carlos", "marina"][Math.floor(Math.random() * 3)])
          .replace("{workflow}", ["ci.yml", "deploy.yml", "lint.yml"][Math.floor(Math.random() * 3)])
          .replace("{tool}", ["search", "sql", "github", "calendar"][Math.floor(Math.random() * 4)]);
        const status = statusPool[Math.floor(Math.random() * statusPool.length)];
        const daysAgo = Math.floor(Math.random() * 14);
        const occurredAt = new Date();
        occurredAt.setHours(8 + Math.floor(Math.random() * 14));
        occurredAt.setMinutes(Math.floor(Math.random() * 60));
        occurredAt.setDate(occurredAt.getDate() - daysAgo);
        bulk.push({
          agentSkillId: install.id,
          summary,
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

  console.log("✅  Seed concluído:");
  console.log(`   • Tenants:     ${await prisma.tenant.count()}`);
  console.log(`   • Users:       ${await prisma.user.count()}`);
  console.log(`   • Agents:      ${await prisma.agent.count()}`);
  console.log(`   • Skills:      ${await prisma.skill.count()}`);
  console.log(`   • AgentSkills: ${await prisma.agentSkill.count()}`);
  console.log(`   • Crons:       ${await prisma.agentCron.count()}`);
  console.log(`   • Events:      ${await prisma.usageEvent.count()}`);
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
