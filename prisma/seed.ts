import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
      create: a,
    });
  }

  console.log("✅  Seed concluído:");
  console.log(`   • Tenants: ${await prisma.tenant.count()}`);
  console.log(`   • Users:   ${await prisma.user.count()}`);
  console.log(`   • Agents:  ${await prisma.agent.count()}`);
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
