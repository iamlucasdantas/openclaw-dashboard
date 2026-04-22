#!/usr/bin/env node
// backfill-tasks.mjs — Parse session JSONL files directly and create Task records
// with structured deliverable data. One Task per session (not per time gap).
//
// Strategy: For each session file, extract the FINAL deliverable:
//   - Images from image_generate tool calls + MEDIA: paths
//   - Content from the last substantial assistant message
//   - Links (WordPress, Instagram, etc.)
//   - Social platforms mentioned
//
// Sessions are filtered aggressively:
//   - Skip internal/operational crons (monitor, backup, healthcheck)
//   - Skip sessions with no real deliverable (chitchat, progress-only)
//   - For ClawDantas (personal assistant), require stronger evidence

import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();


const MEDIA_ROOT = '/root/.openclaw/media';

const AGENTS = [
  { openclawAgent: 'axxion', dashboardAgentId: 'axxion', taskTarget: '~50' },
  { openclawAgent: 'wrexham', dashboardAgentId: 'wrexham', taskTarget: '~8' },
  { openclawAgent: 'clawdantas', dashboardAgentId: 'claw-dantas', taskTarget: '~4' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapMediaPath(absPath) {
  if (!absPath || typeof absPath !== 'string') return null;
  if (!absPath.startsWith(MEDIA_ROOT + '/')) return null;
  const rel = absPath.slice(MEDIA_ROOT.length + 1).split(path.sep).join('/');
  return `/api/media/openclaw/${rel}`;
}

function extractTextParts(message) {
  const content = Array.isArray(message?.content) ? message.content : [];
  return content
    .filter(p => p && typeof p === 'object' && p.type === 'text' && typeof p.text === 'string')
    .map(p => p.text)
    .join('\n\n')
    .trim();
}

function extractToolCalls(message) {
  const content = Array.isArray(message?.content) ? message.content : [];
  return content
    .filter(p => p && typeof p === 'object' && p.type === 'toolCall')
    .map(p => ({
      id: p.id || null,
      name: p.name || null,
      arguments: p.arguments && typeof p.arguments === 'object' ? p.arguments : {},
    }));
}

function sanitize(str) {
  if (!str) return null;
  // Remove lone surrogates for SQLite
  return str.replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '?');
}

// ─── Session Parser ─────────────────────────────────────────────────────────

function parseSession(filePath) {
  const messages = [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj?.type === 'message') messages.push(obj);
    } catch { /* skip malformed */ }
  }
  return messages;
}

// Check if session is a mega-session (long-lived cron that aggregates many tasks)
function isMegaSession(messages) {
  let firstTs = null, lastTs = null, userCount = 0;
  for (const obj of messages) {
    const msg = obj.message || {};
    if (msg.role === 'user') userCount++;
    const ts = obj.timestamp ? new Date(obj.timestamp).getTime() : null;
    if (ts !== null) {
      if (firstTs === null) firstTs = ts;
      lastTs = ts;
    }
  }
  if (firstTs && lastTs) {
    const spanHours = (lastTs - firstTs) / (1000 * 3600);
    if (spanHours > 72) return true;  // Sessions spanning 3+ days are cron aggregations
  }
  if (userCount > 150) return true;  // Sessions with 150+ user messages
  return false;
}

// ─── Extract Cron Info ──────────────────────────────────────────────────────

function extractCronInfo(firstUserMsg) {
  const match = firstUserMsg.match(/^\[cron:([^\]]+)\]\s*([\s\S]*)/);
  if (!match) return null;
  // Parse label from inside the cron brackets
  const cronId = match[1];
  const rest = match[2];
  // The label is often the last part of the cron ID before any additional text
  // Format: "cronId LABEL" where LABEL is the task name
  const labelMatch = cronId.match(/^\S+\s+(.+)$/);
  const label = labelMatch ? labelMatch[1].trim() : cronId;
  return { cronId, label, taskText: rest.trim() };
}

// ─── Is Internal/Operational Session ────────────────────────────────────────

const INTERNAL_CRON_KEYWORDS = [
  'monitor server resources',
  'monitor axion',
  'monitor wrexham',
  'dashboard sync',
  'auto-heal',
  'backup',
  'healthcheck',
  'server monitor',
  'monitor crm',
  'daily learning',
  'aprendizado',
  'rotina de aprendizado',
  'inbox organizer',
  'review',
  'check errors',
  'check logs',
  'verify build',
  'build verification',
];

function isInternalSession(firstUserMsg) {
  const lower = firstUserMsg.toLowerCase();
  for (const kw of INTERNAL_CRON_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  // Sessions that start with just "A new session" greeting
  if (/^A new session was started via/i.test(firstUserMsg)) return true;
  // System heartbeat/exec messages
  if (/^System \(untrusted\)/i.test(firstUserMsg)) return true;
  return false;
}

// ─── Content Noise Detection ────────────────────────────────────────────────

const NOISE_CONTENT_PATTERNS = [
  /^Entendi/i,
  /^Vou fazer/i,
  /^Vou (agora|verificar|checar|buscar|ler|gerar)/i,
  /^Now (let me|I'll|sending)/i,
  /^Agora (vou|vou verificar|enviar|verificando)/i,
  /^Boa!?\s*$/m,
  /^Perfeito!?\s*$/m,
  /^HEARTBEAT_OK/i,
  /^NO_REPLY$/i,
];

function isNoiseText(text) {
  if (!text) return true;
  const t = text.trim();
  if (t.length < 20) return true;
  return NOISE_CONTENT_PATTERNS.some(p => p.test(t));
}

// ─── Deliverable Extraction ─────────────────────────────────────────────────

function extractDeliverable(messages) {
  const images = [];       // {url, alt}
  const links = [];        // {url, label}
  const platforms = new Set();
  let content = null;      // main deliverable text (final substantial assistant message)
  let caption = null;
  let scheduledDate = null;
  let firstTimestamp = null;
  let lastTimestamp = null;

  // Build map: toolCallId → {name, arguments}
  const toolCallsById = new Map();
  const seenImageUrls = new Set();

  for (const obj of messages) {
    const msg = obj.message || {};
    const ts = obj.timestamp ? new Date(obj.timestamp) : null;
    if (ts) {
      if (!firstTimestamp) firstTimestamp = ts;
      lastTimestamp = ts;
    }

    const role = msg.role;
    const text = extractTextParts(msg);

    // Collect tool calls from assistant messages
    if (role === 'assistant') {
      for (const tc of extractToolCalls(msg)) {
        if (tc.id) toolCallsById.set(tc.id, tc);
      }
    }

    // Process tool results for image_generate
    if (role === 'toolResult') {
      const tcId = msg.toolCallId;
      const tc = tcId ? toolCallsById.get(tcId) : null;

      if (tc?.name === 'image_generate') {
        const mediaMatch = text.match(/MEDIA:(\/[^\s\n]+)/);
        if (mediaMatch) {
          const url = mapMediaPath(mediaMatch[1].trim());
          if (url && !seenImageUrls.has(url)) {
            seenImageUrls.add(url);
            images.push({ url, alt: (tc.arguments?.prompt || '').slice(0, 100) });
          }
        }
      }
    }

    // Process assistant text for MEDIA: lines and final content
    if (role === 'assistant' && text && !isNoiseText(text)) {
      // Check for MEDIA: lines in assistant text
      const mediaLines = text.match(/^MEDIA:(\/[^\s\n]+)/gm);
      if (mediaLines) {
        for (const ml of mediaLines) {
          const absPath = ml.replace('MEDIA:', '').trim();
          const url = mapMediaPath(absPath);
          if (url && !seenImageUrls.has(url)) {
            seenImageUrls.add(url);
            images.push({ url, alt: '' });
          }
        }
      }

      // Track the last substantial message as content (deliverable)
      const cleanText = text.replace(/^MEDIA:.*$/gm, '').trim();
      // Only consider as deliverable content if it's meaningful output
      // (not intermediate "Now let me...", "Vou verificar...", etc.)
      if (cleanText.length > 100 && !isIntermediateProgress(cleanText)) {
        content = cleanText;
      }
    }
  }

  // ─── Post-processing ──────────────────────────────────────────────────────

  const allAssistantText = messages
    .filter(m => m.message?.role === 'assistant')
    .map(m => extractTextParts(m.message))
    .join('\n');

  // Detect platforms from ALL text in the session
  const allText = messages
    .filter(m => m.message?.role === 'user' || m.message?.role === 'assistant')
    .map(m => extractTextParts(m.message))
    .join('\n');

  if (/instagram/i.test(allAssistantText)) platforms.add('instagram');
  if (/facebook/i.test(allAssistantText)) platforms.add('facebook');
  if (/tiktok/i.test(allAssistantText)) platforms.add('tiktok');
  if (/wordpress\.com|wp\.json|wp-content|blog.*publish|publish.*blog/i.test(allAssistantText)) platforms.add('wordpress');
  if (/google.*business.*profile|gbp|google.*meu.*negócio/i.test(allAssistantText)) platforms.add('google');
  if (/linkedin/i.test(allAssistantText)) platforms.add('linkedin');

  // Extract links
  const wpLinks = allAssistantText.matchAll(/https?:\/\/[^\s"'<>]*?(?:wordpress\.com|wp-content)[^\s"'<>]*/gi);
  for (const m of wpLinks) links.push({ url: m[0], label: 'WordPress' });

  const igLinks = allAssistantText.matchAll(/https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/gi);
  for (const m of igLinks) links.push({ url: m[0], label: 'Instagram' });

  // Scheduled date
  const schedMatch = allAssistantText.match(/(?:agendado|scheduled|para)\s+(?:dia\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  if (schedMatch) scheduledDate = schedMatch[1];

  return {
    images,
    links: [...new Map(links.map(l => [l.url, l])).values()],
    platforms: [...platforms],
    content,
    caption,
    scheduledDate,
    firstTimestamp: firstTimestamp || new Date(),
    lastTimestamp: lastTimestamp || new Date(),
  };
}

// Check if text is intermediate progress (not final deliverable)
function isIntermediateProgress(text) {
  const patterns = [
    /^Now (let me|I'll|sending|going to)/im,
    /^Vou (agora|verificar|checar|buscar|ler|gerar|enviar)/im,
    /^Agora (vou|enviar|verificando|vou verificar)/im,
    /^(Let me|I'll|Checking|Fetching|Reading|Loading|Searching)/im,
    /^Pegando|Puxando|Buscando/im,
  ];
  return patterns.some(p => p.test(text));
}

// ─── Session Classification ─────────────────────────────────────────────────

function classifySession(messages, firstUserMsg, agentId) {
  const allText = messages
    .filter(m => m.message?.role === 'user' || m.message?.role === 'assistant')
    .map(m => extractTextParts(m.message))
    .join('\n')
    .toLowerCase();

  const cronInfo = extractCronInfo(firstUserMsg);
  const cronLabel = cronInfo?.label?.toLowerCase() || '';

  // Count image_generate tool calls
  let imgGenCount = 0;
  for (const obj of messages) {
    const tcs = extractToolCalls(obj.message);
    for (const tc of tcs) {
      if (tc.name === 'image_generate') imgGenCount++;
    }
  }

  // Carousel: carousel/slide keywords OR multiple image_generate calls
  if (/carrossel|carousel/i.test(allText) && imgGenCount >= 2) return 'carousel';
  if (/carrossel|carousel/i.test(cronLabel) && imgGenCount >= 2) return 'carousel';
  // Slide patterns like "mf-fw2-s1", "c3-slide1" suggest carousel
  if (imgGenCount >= 3 && /slide\d/i.test(allText)) return 'carousel';

  // Blog/Article: WordPress publishing, blog prep
  if (/wordpress.*publish|publish.*blog|blog.*prep|blog.*review|blog.*aprov/i.test(allText)) return 'article';
  if (/blog|article|artigo/i.test(cronLabel) && (imgGenCount > 0 || /wordpress|wp-content/i.test(allText))) return 'article';

  // News: Wrexham news patterns
  if (/not[ií]cias?\s|wrexham.*news|racecourse|transfer|fixture|onde assistir|match.*day/i.test(allText)) return 'news';
  if (/not[ií]cia|news/i.test(cronLabel)) return 'news';

  // Support
  if (/suporte.*cliente|support.*question|atendimento.*cliente|inbound support/i.test(allText)) return 'support';

  // Social post: GBP posts
  if (/google.*business.*profile|gbp|google.*post/i.test(allText) && imgGenCount >= 1) return 'social_post';
  if (/gbp|google post/i.test(cronLabel) && imgGenCount >= 1) return 'social_post';
  // GBP posts without image_generate (use blog images)
  if (/google.*post.*publicad|post.*publicado.*gbp|post publicado no gbp|google business profile post/i.test(allText)) return 'social_post';
  if (/google post/i.test(cronLabel)) return 'social_post';

  // CRM / Prospecting
  if (/pipeline|oportunidade|highlevel.*prospect|prospec/i.test(allText) && !/highlevel.*post/i.test(allText)) return 'crm';
  if (/prospect/i.test(cronLabel)) return 'crm';

  // Single image_generate = social post or carousel
  if (imgGenCount === 1) return 'social_post';
  if (imgGenCount >= 2) return 'carousel';

  // For ClawDantas, be very strict — only allow known business categories
  if (agentId === 'claw-dantas') {
    // Only real deliverables: content sent to clients, blog posts published
    if (/blog.*publish|publish.*blog/i.test(allText)) return 'article';
    if (/instagram.*post|post.*instagram/i.test(allText)) return 'social_post';
    return 'other_strict'; // will be filtered out later
  }

  return 'other';
}

// ─── Title Generation ───────────────────────────────────────────────────────

function generateTitle(deliverable, category, firstUserMsg, cronInfo) {
  // 1. From cron label (clean)
  if (cronInfo) {
    let label = cronInfo.label;
    // Remove parenthetical like (Terça e Quinta), (Modelo C), (Sábado)
    label = label.replace(/\s*[\(（][^)\）]*[\)）]\s*$/g, '').trim();
    // Remove emoji
    label = label.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{200D}]/gu, '').trim();
    // Remove trailing dashes/dots
    label = label.replace(/[\s\-–—.]+$/, '').trim();
    if (label.length > 3 && label.length < 80) {
      return capitalizeFirst(label);
    }
  }

  const c = deliverable.content || '';
  const imgCount = deliverable.images.length;

  if (category === 'article') {
    const titleMatch = c.match(/\*\*(.+?)\*\*/)?.[1]
      || c.match(/^#\s+(.+)$/m)?.[1]
      || c.match(/^##\s+(.+)$/m)?.[1];
    if (titleMatch) return `Blog: ${titleMatch}`.slice(0, 100);
    const brandMatch = firstUserMsg.match(/(The Bar|Gypsy Highway|Sumthin.*Different|Crab Rangoon|Beauty Bar)/i);
    if (brandMatch) return `Blog ${brandMatch[1]}`;
    return 'Blog Post';
  }

  if (category === 'carousel') {
    const brandMatch = firstUserMsg.match(/(The Bar|Gypsy Highway|Sumthin.*Different|Crab Rangoon|Beauty Bar|Magnetic Funnels)/i);
    const suffix = imgCount > 0 ? ` (${imgCount} slides)` : '';
    if (brandMatch) return `Carrossel ${brandMatch[1]}${suffix}`;
    return `Carrossel${suffix}`;
  }

  if (category === 'news') {
    const headlineMatch = c.match(/NOT[ÍI]CIAS.*?[—–]\s*(.+?)(?:\n|$)/i)
      || c.match(/📰\s*(.+?)(?:\n|$)/);
    if (headlineMatch) return headlineMatch[1].trim().slice(0, 100);
    return 'Notícias Wrexham';
  }

  if (category === 'support') return 'Atendimento ao Cliente';
  if (category === 'crm') return 'CRM / Prospecção';

  if (category === 'social_post') {
    const platform = deliverable.platforms[0];
    const platformLabel = platform
      ? { instagram: 'Instagram', facebook: 'Facebook', google: 'GBP', tiktok: 'TikTok' }[platform] || capitalizeFirst(platform)
      : 'Social';
    const brandMatch = firstUserMsg.match(/(The Bar|Gypsy Highway|Sumthin.*Different|Crab Rangoon|Beauty Bar)/i);
    if (brandMatch) return `Post ${platformLabel}: ${brandMatch[1]}`;
    return `Post ${platformLabel}`;
  }

  // Fallback
  if (c) {
    const firstLine = c.split('\n').find(l => l.trim().length > 10);
    if (firstLine) return firstLine.trim().slice(0, 100);
  }
  return 'Tarefa';
}

function capitalizeFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Has Deliverable Check ──────────────────────────────────────────────────

function hasDeliverable(deliverable, category, imgGenCount) {
  // Must have images OR substantial content with platforms
  if (deliverable.images.length > 0) return true;
  if (deliverable.links.length > 0 && deliverable.content && deliverable.content.length > 100) return true;
  // Content-only deliverables (blog text, news text)
  if (category === 'article' && deliverable.content && deliverable.content.length > 100) return true;
  if (category === 'news' && deliverable.content && deliverable.content.length > 200) return true;
  if (category === 'support' && deliverable.content && deliverable.content.length > 100) return true;
  // Social posts: accept with just content (GBP posts may use blog images, not image_generate)
  if (category === 'social_post' && deliverable.content && deliverable.content.length > 100) return true;
  // CRM with evidence of actual prospecting
  if (category === 'crm' && deliverable.content && deliverable.content.length > 200) return true;
  // For 'other' or 'other_strict', require images
  return false;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function backfill() {
  console.log('[backfill-tasks] Starting direct session parsing...');

  const deleted = await prisma.task.deleteMany({});
  console.log(`[backfill-tasks] Cleared ${deleted.count} existing tasks`);

  const agents = await prisma.agent.findMany({
    where: { agentId: { in: AGENTS.map(a => a.dashboardAgentId) } },
    select: { id: true, agentId: true, name: true },
  });

  const agentById = new Map(agents.map(a => [a.agentId, a]));
  let totalTasks = 0;
  let skippedNoDeliverable = 0;
  let skippedInternal = 0;
  let skippedShort = 0;

  for (const cfg of AGENTS) {
    const agent = agentById.get(cfg.dashboardAgentId);
    if (!agent) {
      console.log(`[backfill-tasks] Agent ${cfg.dashboardAgentId} not found in DB, skipping`);
      continue;
    }

    const sessionDir = path.join('/root/.openclaw/agents', cfg.openclawAgent, 'sessions');
    if (!fs.existsSync(sessionDir)) continue;

    const files = fs.readdirSync(sessionDir)
      .filter(name => name.endsWith('.jsonl') && !name.includes('.checkpoint.'))
      .map(name => ({
        name,
        fullPath: path.join(sessionDir, name),
        stat: fs.statSync(path.join(sessionDir, name)),
      }))
      .sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);

    let agentTasks = 0;

    for (const file of files) {
      try {
        const messages = parseSession(file.fullPath);

        // Skip mega-sessions (long-lived cron aggregating many tasks)
        if (isMegaSession(messages)) {
          skippedInternal++;
          continue;
        }

        const hasUser = messages.some(m => m.message?.role === 'user');
        const hasAssistant = messages.some(m => m.message?.role === 'assistant');
        if (!hasUser || !hasAssistant) continue;

        const firstUserMsg = messages
          .filter(m => m.message?.role === 'user')
          .map(m => extractTextParts(m.message))
          .find(t => t.length > 0) || '';

        // Skip short/empty user messages
        if (!firstUserMsg || firstUserMsg.length < 10) { skippedShort++; continue; }

        // Skip internal sessions
        if (isInternalSession(firstUserMsg)) { skippedInternal++; continue; }

        // Count image_generate calls
        let imgGenCount = 0;
        for (const obj of messages) {
          const tcs = extractToolCalls(obj.message);
          for (const tc of tcs) {
            if (tc.name === 'image_generate') imgGenCount++;
          }
        }

        const cronInfo = extractCronInfo(firstUserMsg);
        const category = classifySession(messages, firstUserMsg, cfg.dashboardAgentId);
        const deliverable = extractDeliverable(messages);

        // Check deliverable
        if (!hasDeliverable(deliverable, category, imgGenCount)) {
          skippedNoDeliverable++;
          continue;
        }

        const title = generateTitle(deliverable, category, firstUserMsg, cronInfo);

        // Build structured deliverable data
        const deliverableData = {
          title,
          content: null,
          images: deliverable.images,
          links: deliverable.links,
          platforms: deliverable.platforms,
          scheduledDate: deliverable.scheduledDate || null,
          caption: null,
        };

        // Set content based on category
        if (category === 'article' && deliverable.content) {
          deliverableData.content = deliverable.content.slice(0, 5000);
        } else if (category === 'news' && deliverable.content) {
          deliverableData.content = deliverable.content.slice(0, 5000);
        } else if (category === 'social_post' && deliverable.content) {
          deliverableData.caption = deliverable.content.slice(0, 2000);
          deliverableData.content = deliverable.content.slice(0, 2000);
        } else if (category === 'carousel' && deliverable.content) {
          deliverableData.caption = deliverable.content.slice(0, 2000);
        } else if (deliverable.content) {
          deliverableData.content = deliverable.content.slice(0, 3000);
        }

        // Result summary
        let resultSummary = null;
        if (deliverable.images.length > 0) {
          resultSummary = deliverable.images.length === 1
            ? '1 imagem gerada'
            : `${deliverable.images.length} imagens geradas`;
        } else if (deliverable.content) {
          resultSummary = deliverable.content.slice(0, 200);
        }

        const resultUrl = deliverable.images[0]?.url || deliverable.links[0]?.url || null;
        const resultType = deliverable.images.length > 0 ? 'image' : deliverable.links.length > 0 ? 'link' : 'text';

        const created = await prisma.task.create({
          data: {
            agentId: agent.id,
            title: sanitize(title),
            status: 'completed',
            category: category === 'other_strict' ? 'other' : category,
            result: sanitize(resultSummary),
            resultType,
            resultUrl,
            deliverableData: sanitize(JSON.stringify(deliverableData)),
            startedAt: deliverable.firstTimestamp,
            resolvedAt: deliverable.lastTimestamp,
          },
        });

        // Auto-enrich blog tasks with full content from URL
        if (['article', 'news'].includes(category) && deliverableData.links?.length > 0) {
          try {
            const linkUrl = typeof deliverableData.links[0] === 'string'
              ? deliverableData.links[0]
              : deliverableData.links[0]?.url;
            if (linkUrl) {
              const { execSync } = await import('node:child_process');
              execSync(`DATABASE_URL=file:./dev.db node scripts/enrich-task-content.js ${created.id}`, {
                timeout: 30000,
                stdio: 'pipe',
              });
              console.log(`  [enrich] ${title}: fetched full content`);
            }
          } catch (e) {
            console.log(`  [enrich] ${title}: skip (${e.message.slice(0, 60)})`);
          }
        }

        agentTasks++;
      } catch (err) {
        console.error(`[backfill-tasks] Error processing ${file.name}:`, err.message);
      }
    }

    console.log(`[backfill-tasks] ${agent.name} (${cfg.dashboardAgentId}): ${agentTasks} tasks from ${files.length} sessions (target: ${cfg.taskTarget})`);
    totalTasks += agentTasks;
  }

  console.log(`\n[backfill-tasks] Done. Total: ${totalTasks} tasks`);
  console.log(`[backfill-tasks] Skipped: ${skippedNoDeliverable} (no deliverable), ${skippedInternal} (internal), ${skippedShort} (short)`);

  // Show latest tasks
  const tasks = await prisma.task.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
    select: {
      title: true,
      category: true,
      deliverableData: true,
      agent: { select: { name: true } },
    },
  });

  console.log('\nLatest tasks:');
  for (const t of tasks) {
    let dd = {};
    try { dd = JSON.parse(t.deliverableData || '{}'); } catch {}
    const imgs = dd.images?.length || 0;
    const plats = dd.platforms?.join(',') || '-';
    console.log(`  [${t.agent.name}] ${t.category} | imgs:${imgs} | ${plats} | ${t.title}`);
  }

  // Per-agent counts
  console.log('\nPer-agent task counts:');
  for (const cfg of AGENTS) {
    const agent = agentById.get(cfg.dashboardAgentId);
    if (!agent) continue;
    const count = await prisma.task.count({ where: { agentId: agent.id } });
    console.log(`  ${cfg.dashboardAgentId}: ${count} tasks`);
  }

  await prisma.$disconnect();
}

backfill().catch(e => { console.error(e); process.exit(1); });
