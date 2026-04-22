#!/usr/bin/env node
/**
 * dashboard-sync.js — Sync OpenClaw runtime data to Dashboard DB
 * Runs via cron every 5 minutes
 *
 * Syncs: agent metadata, crons, agent status, skills
 * Source of truth: openclaw.json + openclaw cron list + filesystem
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const OC_CONFIG_PATH = '/root/.openclaw/openclaw.json';
const AVATAR_DIR = '/root/.openclaw/media/telegram-avatars';
const MEDIA_ROUTE_PREFIX = '/api/media/openclaw/telegram-avatars';

// Map OpenClaw agent IDs to dashboard agentId (DB field)
const AGENT_MAP = {
  clawdantas: 'claw-dantas',
  axxion: 'axxion',
  wrexham: 'wrexham',
  main: 'claw-dantas',
};

// Patterns to detect which agent a cron ACTUALLY belongs to,
// even if OpenClaw registers it under clawdantas (main agent).
const CRON_AGENT_OWNERSHIP = [
  // Explicit prefix: "Axxion — ..." or "Wrexham — ..."
  { pattern: /^Axxion\s*[—–-]/i, agentId: 'axxion' },
  { pattern: /^Wrexham\s*[—–-]/i, agentId: 'wrexham' },
  // Content keywords specific to each agent
  { pattern: /Wrexham|Comunidade Wrexham|Onde Assistir|Not.cias Wrexham/i, agentId: 'wrexham' },
  { pattern: /Beauty Bar|Sumthin Different|Blog The Bar|GBP.*Post|SEO.*Bar|GBP Daily|The Bar.*Blog/i, agentId: 'axxion' },
  { pattern: /CRM.*Henrique|Monitor CRM/i, agentId: 'axxion' },
  { pattern: /Instagram Carousel|carrossel|Ideias de Conte.do|SAAS Campaign|Relat.rio Mensal.*Perguntas/i, agentId: 'claw-dantas' },
];

function resolveCronAgent(job) {
  const name = job?.name || '';
  const command = job?.payload?.message || job?.payload?.text || '';
  const combined = name + ' ' + command;

  for (const rule of CRON_AGENT_OWNERSHIP) {
    if (rule.pattern.test(combined)) {
      return rule.agentId;
    }
  }
  // Fallback to the original agent mapping
  const ocAgentId = job.agentId;
  return AGENT_MAP[ocAgentId] || ocAgentId;
}

const INTERNAL_CRON_NAME_PATTERNS = [
  /dashboard sync/i,
  /monitor server resources/i,
  /monitor axion & wrexham bots/i,
  /telegram auto-heal/i,
  /backup workspace/i,
  /monitor github dashboard/i,
];

const INTERNAL_CRON_COMMAND_PATTERNS = [
  /dashboard-sync\.js/i,
  /server monitor\./i,
  /telegram-healthcheck\.sh/i,
  /backup-workspace\.sh/i,
  /\/tmp\/openclaw\//i,
  /\/root\/\.openclaw\//i,
  /openclaw-\$\(date \+%Y-%m-%d\)\.log/i,
];

// ── Helpers ──────────────────────────────────────────────────────────

function loadOpenClawConfig() {
  try {
    return JSON.parse(fs.readFileSync(OC_CONFIG_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function getAgentAvatarUrl(ocAgentId) {
  const filename = `${ocAgentId}.jpg`;
  const fullPath = path.join(AVATAR_DIR, filename);
  if (fs.existsSync(fullPath)) {
    return `${MEDIA_ROUTE_PREFIX}/${filename}`;
  }
  return null;
}

async function getDbAgents() {
  const agents = await p.agent.findMany();
  const map = {};
  for (const a of agents) map[a.agentId] = a.id;
  return { agents, map };
}

function scheduleToString(sched) {
  if (!sched || typeof sched !== 'object') return '?';
  if (sched.kind === 'cron') return sched.expr;
  if (sched.kind === 'every') {
    const minutes = Math.round((sched.everyMs || 0) / 60000);
    if (minutes > 0 && minutes % 1440 === 0) return `every ${minutes / 1440}d`;
    if (minutes > 0 && minutes % 60 === 0) return `every ${minutes / 60}h`;
    return `every ${minutes}m`;
  }
  if (sched.kind === 'at') return sched.at;
  return '?';
}

function isInternalOperationalCron(job) {
  const name = job?.name || '';
  const command = job?.payload?.message || job?.payload?.text || '';
  return (
    INTERNAL_CRON_NAME_PATTERNS.some((r) => r.test(name)) ||
    INTERNAL_CRON_COMMAND_PATTERNS.some((r) => r.test(command))
  );
}

// ── Sync Agent Metadata ──────────────────────────────────────────────

async function syncAgentMetadata(agentMap) {
  const config = loadOpenClawConfig();
  if (!config) {
    console.error(`[${new Date().toISOString()}] Cannot read openclaw.json`);
    return;
  }

  const agentList = config.agents?.list || [];
  let updated = 0;

  for (const ocAgent of agentList) {
    const ocId = ocAgent.id;
    const dbAgentId = AGENT_MAP[ocId] || ocId;
    const dbId = agentMap[dbAgentId];
    if (!dbId) continue;

    const model = ocAgent.model?.primary || null;
    const avatarUrl = getAgentAvatarUrl(ocId);
    const name = ocAgent.name || dbAgentId;

    // Read description from workspace SOUL.md
    const ws = ocAgent.workspace || '';
    let description = null;
    const soulPath = path.join(ws, 'SOUL.md');
    if (fs.existsSync(soulPath)) {
      const content = fs.readFileSync(soulPath, 'utf8');
      // Extract meaningful lines, skip headers and italic placeholders
      const lines = content.split('\n').filter((l) => {
        const t = l.trim();
        return t && !t.startsWith('#') && !t.startsWith('_') && t.length > 20;
      });
      if (lines.length > 0) description = lines.slice(0, 2).join(' ').trim().slice(0, 250);
    }

    const data = {
      model,
      status: 'online',
      lastHeartbeatAt: new Date(),
    };
    if (avatarUrl) data.avatarUrl = avatarUrl;
    if (name) data.name = name;
    if (description) data.description = description;

    await p.agent.update({ where: { id: dbId }, data });
    updated++;
  }

  console.log(`[${new Date().toISOString()}] Agent metadata synced: ${updated}`);
}

// ── Sync Crons ───────────────────────────────────────────────────────

async function syncCrons(agentMap) {
  try {
    const out = execSync('openclaw cron list --json --all --timeout 15000', { timeout: 20000 });
    const data = JSON.parse(out.toString());
    const jobs = data.jobs || [];

    const managedAgentDbIds = new Set();
    const liveJobIds = new Set();
    let synced = 0;
    let skippedInternal = 0;

    for (const j of jobs) {
      const resolvedAgentId = resolveCronAgent(j);
      const dbAgentId = agentMap[resolvedAgentId];
      if (!dbAgentId) continue;

      managedAgentDbIds.add(dbAgentId);

      if (isInternalOperationalCron(j)) {
        skippedInternal++;
        continue;
      }

      liveJobIds.add(j.id);

      const state = j.state || {};
      const lastRun = state.lastRunAtMs ? new Date(state.lastRunAtMs) : null;
      const nextRun = state.nextRunAtMs ? new Date(state.nextRunAtMs) : null;

      await p.agentCron.upsert({
        where: { id: j.id },
        create: {
          id: j.id,
          agentId: dbAgentId,
          name: j.name,
          schedule: scheduleToString(j.schedule),
          command: j.payload?.message || j.payload?.text || '',
          state: j.enabled ? 'active' : 'disabled',
          lastRunAt: lastRun,
          lastRunStatus: state.lastRunStatus || null,
          lastRunMessage: state.lastError || null,
          nextRunAt: nextRun,
        },
        update: {
          agentId: dbAgentId,
          name: j.name,
          schedule: scheduleToString(j.schedule),
          command: j.payload?.message || j.payload?.text || '',
          state: j.enabled ? 'active' : 'disabled',
          lastRunAt: lastRun,
          lastRunStatus: state.lastRunStatus || null,
          lastRunMessage: state.lastError || null,
          nextRunAt: nextRun,
        },
      });
      synced++;
    }

    if (managedAgentDbIds.size > 0) {
      const stale = await p.agentCron.findMany({
        where: {
          agentId: { in: Array.from(managedAgentDbIds) },
          id: { notIn: Array.from(liveJobIds) },
        },
        select: { id: true },
      });
      if (stale.length > 0) {
        await p.agentCron.deleteMany({
          where: { id: { in: stale.map((c) => c.id) } },
        });
      }
      console.log(
        `[${new Date().toISOString()}] Crons synced: ${synced} (internal hidden: ${skippedInternal}, stale removed: ${stale.length})`
      );
      return;
    }

    console.log(`[${new Date().toISOString()}] Crons synced: ${synced} (internal hidden: ${skippedInternal})`);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Cron sync error: ${e.message}`);
  }
}

// ── Sync Runtime Activity ────────────────────────────────────────────

function syncRuntimeActivity() {
  try {
    execSync("DATABASE_URL='file:./dev.db' node scripts/sync-runtime-activity.mjs", {
      stdio: 'inherit',
      timeout: 120000,
    });
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Activity sync error: ${e.message}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`[${new Date().toISOString()}] Dashboard sync starting...`);
  const { map: agentMap } = await getDbAgents();

  await syncAgentMetadata(agentMap);
  await syncCrons(agentMap);
  syncRuntimeActivity();

  console.log(`[${new Date().toISOString()}] Dashboard sync complete`);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
