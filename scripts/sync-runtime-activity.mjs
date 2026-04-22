import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const prisma = new PrismaClient();

const AGENTS = [
  { openclawAgent: 'clawdantas', dashboardAgentId: 'claw-dantas' },
  { openclawAgent: 'axxion', dashboardAgentId: 'axxion' },
  { openclawAgent: 'wrexham', dashboardAgentId: 'wrexham' },
];

const MEDIA_ROOT = '/root/.openclaw/media';
const DAYS = Number(process.env.ACTIVITY_SYNC_DAYS || 14);
const MAX_FILES_PER_AGENT = Number(process.env.ACTIVITY_SYNC_FILES || 30);

const PROGRESS_PATTERNS = [
  /^(vou|agora vou|estou|tamb[eé]m vou)\b/i,
  /^j[aá]\s+(comecei|deixei|subi|corrigi|apliquei)\b/i,
  /^(peguei o erro|recebi o [aá]udio|a raiz do erro|eu j[aá] comecei|tamb[eé]m achei)\b/i,
];

function stableId(...parts) {
  return 'rt_' + crypto.createHash('sha1').update(parts.join(':')).digest('hex').slice(0, 24);
}

function mapMediaPath(absPath) {
  if (!absPath || !absPath.startsWith(MEDIA_ROOT + '/')) return null;
  const rel = absPath.slice(MEDIA_ROOT.length + 1).split(path.sep).join('/');
  return `/api/media/openclaw/${rel}`;
}

function classifyMedia(url) {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/i.test(lower)) return 'image';
  if (/^https?:\/\//i.test(lower)) return 'link';
  return 'file';
}

function extractToolCalls(message) {
  const content = Array.isArray(message?.content) ? message.content : [];
  return content
    .filter((part) => part && typeof part === 'object' && part.type === 'toolCall')
    .map((part) => ({
      id: part.id || null,
      name: part.name || null,
      arguments: part.arguments && typeof part.arguments === 'object' ? part.arguments : {},
    }));
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = match[1] || match[2] || match[3] || null;
    if (value) return value.trim().replace(/^['"]|['"]$/g, '');
  }
  return null;
}

function extractDeliveryMeta(command) {
  if (!command || typeof command !== 'string') return null;

  const mediaAbs = firstMatch(command, [
    /--media\s+"([^"]+)"/i,
    /--media\s+'([^']+)'/i,
    /--media\s+([^\s|&;]+)/i,
    /document=@"([^"]+)"/i,
    /document=@'([^']+)'/i,
    /document=@([^\s|&;]+)/i,
  ]);

  if (!mediaAbs) return null;

  const caption = firstMatch(command, [
    /--message\s+"([\s\S]*?)"(?=\s|$)/i,
    /--message\s+'([\s\S]*?)'(?=\s|$)/i,
    /caption=\"([\s\S]*?)\"/i,
    /caption='([\s\S]*?)'/i,
    /caption=([^"'\s][^|&;]*)/i,
  ]);

  return {
    mediaAbs,
    mediaUrl: mapMediaPath(mediaAbs),
    caption: caption
      ? normalizeWhitespace(caption.replace(/\\n/g, '\n').replace(/\s*["']?\s*2>.*$/i, '').trim())
      : null,
  };
}

function isSuccessfulToolResult(obj, text) {
  const normalized = normalizeWhitespace(text || '');
  if (!normalized) return false;
  if (/command still running|process still running/i.test(normalized)) return false;
  if (obj?.isError === true) return false;

  const details = obj?.message?.details || {};
  if (typeof details.exitCode === 'number') return details.exitCode === 0;
  if (details.status === 'completed') return true;
  if (/sent via telegram|message id:|(^|\b)ok\b/i.test(normalized)) return true;
  if (/error|failed|traceback|cannot|no such file|permission denied/i.test(normalized)) return false;
  return true;
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function cleanText(text) {
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('MEDIA:'))
    .join('\n')
    .replace(/^\[\[.*?\]\]\s*/gm, '')
    .trim();
}

function summarize(text, mediaUrl, sessionKind = 'chat') {
  const cleaned = cleanText(text);
  const lines = cleaned
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (mediaUrl) {
    if (/\.pdf($|\?)/i.test(mediaUrl)) {
      if (/carrossel|carousel|slide/i.test(cleaned)) return 'Gerou PDF de carrossel';
      return 'Gerou PDF do agente';
    }
    if (/carrossel|carousel|slide/i.test(cleaned)) return 'Gerou artes de carrossel';
    if (/imagem|foto|arte/i.test(cleaned)) return 'Gerou mídia visual';
    return 'Gerou mídia do agente';
  }

  if (sessionKind === 'cron') {
    const match = cleaned.match(/Crons synced:\s*(\d+)/i);
    if (match) return `Sincronizou ${match[1]} cron(s) do dashboard`;
    if (/restart|reinici/i.test(cleaned)) return 'Executou ação operacional automática';
    if (/erro|error|failed|falhou|offline/i.test(cleaned)) return 'Cron detectou problema operacional';
  }

  const first = normalizeWhitespace(lines[0] || 'Atualização do agente');
  return first.length > 120 ? first.slice(0, 117) + '...' : first;
}

function extractTextParts(message) {
  const content = Array.isArray(message?.content) ? message.content : [];
  return content
    .filter((part) => part && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n\n')
    .trim();
}

function parseSessionContext(userText) {
  const text = userText || '';
  if (/^\[cron:/i.test(text)) {
    const cronName = text.match(/^\[cron:[^\]]+\]\s*([^\n]+)/i)?.[1]?.trim() || 'Cron';
    return { kind: 'cron', label: cronName };
  }

  if (/Conversation info \(untrusted metadata\):/i.test(text)) {
    return { kind: 'external-chat', label: 'external-chat' };
  }

  if (/^\[media attached:/i.test(text) || /System \(untrusted\):\s*\[/i.test(text)) {
    return { kind: 'external-chat', label: 'external-chat' };
  }

  if (/"channel"\s*:\s*"exec-event"/i.test(text) || /An async command you ran earlier has completed/i.test(text)) {
    return { kind: 'internal', label: 'internal' };
  }

  if (/The conversation history before this point was compacted/i.test(text)) {
    return { kind: 'internal', label: 'internal' };
  }

  return { kind: 'internal', label: 'internal' };
}

function isNoiseText(text, { sessionKind = 'chat', hasMedia = false } = {}) {
  const cleaned = cleanText(text);
  const normalized = normalizeWhitespace(cleaned);
  if (!normalized) return true;
  if (normalized === 'NO_REPLY' || normalized === 'HEARTBEAT_OK') return true;
  if (/^System \(untrusted\):/i.test(normalized)) return true;
  if (/^An async command you ran earlier has completed/i.test(normalized)) return true;
  if (/Process still running|Command still running|Process exited with code/i.test(normalized)) return true;
  if (!hasMedia && PROGRESS_PATTERNS.some((pattern) => pattern.test(normalized))) return true;
  // Filter out operational/internal OpenClaw messages
  if (/dashboard[- ]?sync|auto-heal|backup.workspace|server.monitor|telegram.healthcheck/i.test(normalized)) return true;
  if (/cron detectou problema operacional|operacional automático/i.test(normalized)) return true;

  if (sessionKind === 'cron') {
    if (/HEARTBEAT_OK/i.test(normalized)) return true;
    if (/^Current time:/i.test(normalized)) return true;
    if (/^vou\b/i.test(normalized)) return true;
  }

  return false;
}

function buildCronActivity(rawText, cronLabel = '') {
  const body = cleanText(rawText);
  const normalized = normalizeWhitespace(body);
  if (!normalized || normalized === 'HEARTBEAT_OK') return null;

  if (/dashboard sync/i.test(cronLabel)) {
    const syncMatch = body.match(/Crons synced:\s*(\d+)/i);
    if (!syncMatch) return null;
    return {
      summary: `Sincronizou ${syncMatch[1]} cron(s) do dashboard`,
      body,
      status: 'ok',
      contentType: null,
      contentUrl: null,
    };
  }

  if (/telegram auto-heal/i.test(cronLabel)) {
    if (!/reinici|restart|auto-heal|action was taken|a[cç][aã]o tomada/i.test(body)) return null;
    return {
      summary: 'Executou ação operacional automática',
      body,
      status: /erro|error|failed/i.test(body) ? 'warning' : 'ok',
      contentType: null,
      contentUrl: null,
    };
  }

  if (/monitor axion|monitor wrexham|monitor server resources/i.test(cronLabel)) {
    if (!/erro|error|failed|falhou|offline|terminated|crash|409|alert/i.test(body)) return null;
    return {
      summary: 'Cron detectou problema operacional',
      body,
      status: 'warning',
      contentType: null,
      contentUrl: null,
    };
  }

  return null;
}

async function ensureAgentActivitySkill() {
  const skill = await prisma.skill.upsert({
    where: { slug: 'agent-activity' },
    update: {
      name: 'Agent Activity',
      category: 'utility',
      description: 'Linha do tempo operacional real do agente, sincronizada a partir das sessões.',
      source: 'local',
      version: '0.2.0',
    },
    create: {
      slug: 'agent-activity',
      name: 'Agent Activity',
      category: 'utility',
      description: 'Linha do tempo operacional real do agente, sincronizada a partir das sessões.',
      source: 'local',
      version: '0.2.0',
    },
  });

  const agents = await prisma.agent.findMany({
    where: { agentId: { in: AGENTS.map((a) => a.dashboardAgentId) } },
    select: { id: true, agentId: true },
  });

  const map = new Map();
  for (const agent of agents) {
    const row = await prisma.agentSkill.upsert({
      where: { agentId_skillId: { agentId: agent.id, skillId: skill.id } },
      update: { enabled: true },
      create: { agentId: agent.id, skillId: skill.id, enabled: true },
      select: { id: true },
    });
    map.set(agent.agentId, row.id);
  }

  return { skillId: skill.id, map };
}

async function processSessionFile(filePath, dashboardAgentId, agentSkillId) {
  let inserted = 0;
  let sessionContext = { kind: 'internal', label: 'internal' };
  const pendingDeliveries = new Map();

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, 'utf8'),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }

    if (obj?.type !== 'message') continue;
    const message = obj.message || {};
    const text = extractTextParts(message);

    if (message.role === 'user') {
      sessionContext = parseSessionContext(text);
      continue;
    }

    if (sessionContext.kind === 'internal') continue;

    if (message.role === 'assistant') {
      for (const toolCall of extractToolCalls(message)) {
        if (toolCall.name !== 'exec') continue;
        const delivery = extractDeliveryMeta(toolCall.arguments?.command);
        if (!delivery?.mediaUrl || !toolCall.id) continue;
        pendingDeliveries.set(toolCall.id, delivery);
      }

      if (!text || text.trim() === 'NO_REPLY') continue;

      const mediaMatch = text.match(/^MEDIA:(.+)$/m);
      const mediaAbs = mediaMatch?.[1]?.trim() || null;
      const mediaUrl = mapMediaPath(mediaAbs);
      const contentType = classifyMedia(mediaUrl);
      const body = cleanText(text) || null;
      const hasMedia = !!mediaUrl;

      if ((!body && !mediaUrl) || isNoiseText(text, { sessionKind: sessionContext.kind, hasMedia })) {
        continue;
      }

      // Allow: external-chat messages (with or without media),
      // internal messages with media, and any substantive assistant response
      // that is longer than a trivial reply.
      const isSubstantive = body && body.length > 40 && sessionContext.kind !== 'internal';
      if (!hasMedia && !isSubstantive) {
        continue;
      }

      const id = stableId(dashboardAgentId, 'assistant', obj.id || message.responseId || filePath, text);
      const occurredAt = obj.timestamp ? new Date(obj.timestamp) : new Date();

      await prisma.skillActivity.upsert({
        where: { id },
        update: {
          summary: summarize(text, mediaUrl, sessionContext.kind),
          body,
          contentType,
          contentUrl: mediaUrl,
          status: 'ok',
          occurredAt,
        },
        create: {
          id,
          agentSkillId,
          summary: summarize(text, mediaUrl, sessionContext.kind),
          body,
          contentType,
          contentUrl: mediaUrl,
          status: 'ok',
          occurredAt,
        },
      });
      inserted++;
      continue;
    }

    if (message.role === 'toolResult' && sessionContext.kind === 'external-chat') {
      const delivery = pendingDeliveries.get(message.toolCallId);
      if (!delivery?.mediaUrl) continue;
      if (!isSuccessfulToolResult(obj, text)) continue;

      const contentType = classifyMedia(delivery.mediaUrl);
      const body = delivery.caption || cleanText(text) || null;
      const summary = summarize(body || 'Entrega do agente', delivery.mediaUrl, sessionContext.kind);
      const occurredAt = obj.timestamp ? new Date(obj.timestamp) : new Date();
      const id = stableId(dashboardAgentId, 'delivery', filePath, message.toolCallId || obj.id || delivery.mediaUrl);

      await prisma.skillActivity.upsert({
        where: { id },
        update: {
          summary,
          body,
          contentType,
          contentUrl: delivery.mediaUrl,
          status: 'ok',
          occurredAt,
        },
        create: {
          id,
          agentSkillId,
          summary,
          body,
          contentType,
          contentUrl: delivery.mediaUrl,
          status: 'ok',
          occurredAt,
        },
      });
      inserted++;
      continue;
    }

    if (message.role === 'toolResult' && sessionContext.kind === 'cron') {
      const activity = buildCronActivity(text, sessionContext.label);
      if (!activity) continue;

      const occurredAt = obj.timestamp ? new Date(obj.timestamp) : new Date();
      const id = stableId(dashboardAgentId, 'cron-tool', filePath, obj.toolCallId || obj.id || text);

      await prisma.skillActivity.upsert({
        where: { id },
        update: { ...activity, occurredAt },
        create: {
          id,
          agentSkillId,
          ...activity,
          occurredAt,
        },
      });
      inserted++;
    }
  }

  return inserted;
}

async function main() {
  const { skillId, map: agentSkillMap } = await ensureAgentActivitySkill();
  await prisma.skillActivity.deleteMany({
    where: {
      agentSkill: {
        skillId,
      },
    },
  });

  const sinceMs = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  let total = 0;

  for (const cfg of AGENTS) {
    const agentSkillId = agentSkillMap.get(cfg.dashboardAgentId);
    if (!agentSkillId) continue;

    const sessionDir = path.join('/root/.openclaw/agents', cfg.openclawAgent, 'sessions');
    if (!fs.existsSync(sessionDir)) continue;

    const files = fs
      .readdirSync(sessionDir)
      .filter((name) => name.endsWith('.jsonl') && !name.includes('.checkpoint.'))
      .map((name) => path.join(sessionDir, name))
      .map((fullPath) => ({ fullPath, stat: fs.statSync(fullPath) }))
      .filter((entry) => entry.stat.mtimeMs >= sinceMs)
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
      .slice(0, MAX_FILES_PER_AGENT);

    for (const entry of files) {
      total += await processSessionFile(entry.fullPath, cfg.dashboardAgentId, agentSkillId);
    }
  }

  console.log(`Runtime activities synced: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
