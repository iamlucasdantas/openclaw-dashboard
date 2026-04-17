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

  console.log("✅  Seed concluído:");
  console.log(`   • Tenants: ${await prisma.tenant.count()}`);
  console.log(`   • Users:   ${await prisma.user.count()}`);
  console.log(`   • Agents:  ${await prisma.agent.count()}`);
  console.log(`   • Events:  ${await prisma.usageEvent.count()}`);
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
