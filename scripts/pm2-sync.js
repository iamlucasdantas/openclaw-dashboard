const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log(`[${new Date().toISOString()}] Dashboard sync starting...`);
  
  // Verificar crons no OpenClaw
  const { execSync } = require('child_process');
  try {
    const out = execSync('openclaw cron list --json --all --timeout 15000', { timeout: 20000 });
    const data = JSON.parse(out.toString());
    console.log(`Crons encontrados: ${data.jobs.length}`);
  } catch (e) {
    console.log(`[ERROR] Crons: ${e.message}`);
  }
  
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
