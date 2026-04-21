#!/usr/bin/env node
/**
 * dashboard-sync.js — Sync OpenClaw agent data to Dashboard DB
 * Runs via cron every 5 minutes
 * 
 * Syncs: crons, agent status, usage events
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const AGENT_MAP = {
  'clawdantas': 'claw-dantas',
  'axxion': 'axxion',
  'wrexham': 'wrexham',
  'main': 'claw-dantas',
};

async function getDbAgents() {
  const agents = await p.agent.findMany();
  const map = {};
  for (const a of agents) map[a.agentId] = a.id;
  return { agents, map };
}

async function syncCrons(agentMap) {
  try {
    const out = execSync('openclaw cron list --json --all --timeout 15000', { timeout: 20000 });
    const data = JSON.parse(out.toString());
    const jobs = data.jobs || [];

    // Get existing cron IDs from DB
    const existingCrons = await p.agentCron.findMany({ select: { id: true } });
    const existingIds = new Set(existingCrons.map(c => c.id));

    let synced = 0;
    for (const j of jobs) {
      const ocAgentId = j.agentId;
      const mappedAgentId = AGENT_MAP[ocAgentId] || ocAgentId;
      const dbAgentId = agentMap[mappedAgentId];
      if (!dbAgentId) continue;

      const sched = j.schedule;
      const scheduleStr = sched.kind === 'cron' ? sched.expr :
                          sched.kind === 'every' ? `every ${Math.round(sched.everyMs/60000)}m` :
                          sched.kind === 'at' ? sched.at : '?';
      const state = j.state || {};
      const lastRun = state.lastRunAtMs ? new Date(state.lastRunAtMs) : null;
      const nextRun = state.nextRunAtMs ? new Date(state.nextRunAtMs) : null;

      await p.agentCron.upsert({
        where: { id: j.id },
        create: {
          id: j.id,
          agentId: dbAgentId,
          name: j.name,
          schedule: scheduleStr,
          command: j.payload?.message || j.payload?.text || '',
          state: j.enabled ? 'active' : 'disabled',
          lastRunAt: lastRun,
          lastRunStatus: state.lastRunStatus || null,
          lastRunMessage: state.lastError || null,
          nextRunAt: nextRun,
        },
        update: {
          name: j.name,
          schedule: scheduleStr,
          command: j.payload?.message || j.payload?.text || '',
          state: j.enabled ? 'active' : 'disabled',
          lastRunAt: lastRun,
          lastRunStatus: state.lastRunStatus || null,
          lastRunMessage: state.lastError || null,
          nextRunAt: nextRun,
        }
      });
      synced++;
    }
    console.log(`[${new Date().toISOString()}] Crons synced: ${synced}`);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Cron sync error: ${e.message}`);
  }
}

async function syncAgentStatus(agentMap) {
  // Update ClawDantas status (we can check if it's responding)
  try {
    const resp = execSync('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3100/health 2>/dev/null || echo 000', { timeout: 5000 });
    const dashboardUp = resp.toString().trim() === '200' || resp.toString().trim() === '307';
    
    // Check agent processes via PM2-like indicators
    const agents = await p.agent.findMany();
    for (const a of agents) {
      // ClawDantas is this agent, always online
      if (a.agentId === 'claw-dantas') {
        await p.agent.update({ where: { id: a.id }, data: { status: 'online', lastHeartbeatAt: new Date() } });
      }
      // Axxion and Wrexham status based on heartbeat
      // (heartbeat script posts to /api/agents/{id}/heartbeat)
    }
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Status sync error: ${e.message}`);
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Dashboard sync starting...`);
  const { agents, map: agentMap } = await getDbAgents();
  
  await syncCrons(agentMap);
  await syncAgentStatus(agentMap);
  
  // Update last sync time (via heartbeat for clawdantas)
  const cd = agentMap['claw-dantas'];
  if (cd) {
    await p.agent.update({ where: { id: cd }, data: { lastHeartbeatAt: new Date() } });
  }
  
  console.log(`[${new Date().toISOString()}] Dashboard sync complete`);
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
