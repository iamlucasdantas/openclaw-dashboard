#!/usr/bin/env node
/**
 * enrich-task-content.js — Fetch full content for blog/social tasks
 * Called once after a task is created (not on a loop).
 * Usage: node enrich-task-content.js <taskId>
 * Or: node enrich-task-content.js --all --pending
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');
const http = require('http');

function fetchUrl(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DashboardBot/1.0)' }, timeout }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, timeout).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractArticleFromHtml(html) {
  // Try <article> first, then <main>, then fall back to body
  let block = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1]
    || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1]
    || html;

  // Remove noise
  block = block.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Extract og:image
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
    || null;

  // Extract title from og:title or <h1>
  const title = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim()
    || null;

  // Convert HTML to readable text
  let text = block
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&#8217;/g, "'").replace(/&#8211;/g, '-').replace(/&#8212;/g, '—')
    .replace(/&#8220;|&#8221;/g, '"').replace(/&#8216;|&#8218;/g, "'")
    .replace(/&#038;/g, '&').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&#215;/g, 'x').replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—').replace(/&hellip;/g, '…');

  // Clean up whitespace
  text = text.replace(/\r/g, '').replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  return { text, title, ogImage };
}

async function enrichTask(taskId) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    console.log(`Task ${taskId} not found`);
    return false;
  }

  let dd;
  try { dd = JSON.parse(task.deliverableData || '{}'); } catch { dd = {}; }

  const isBlog = ['article', 'news'].includes(task.category);
  const isSocial = ['social_post', 'carousel'].includes(task.category);

  if (!isBlog && !isSocial) {
    console.log(`Task ${taskId}: category "${task.category}" not enrichable, skipping`);
    return false;
  }

  // Find URL to fetch from
  const links = dd.links || [];
  const linkUrl = typeof links[0] === 'string' ? links[0]
    : links[0]?.url || null;

  if (!linkUrl) {
    console.log(`Task ${taskId} (${task.title}): no URL found, skipping`);
    return false;
  }

  // Check if already enriched (content > 500 chars)
  if ((dd.content || '').length > 500) {
    console.log(`Task ${taskId} (${task.title}): already enriched (${(dd.content||'').length} chars), skipping`);
    return false;
  }

  console.log(`Fetching: ${linkUrl}`);
  try {
    const html = await fetchUrl(linkUrl);
    const { text, title, ogImage } = extractArticleFromHtml(html);

    if (text.length < 50) {
      console.log(`  Extracted only ${text.length} chars — site may be JS-rendered. Using web_fetch fallback needed.`);
      return false;
    }

    const oldLen = (dd.content || '').length;

    // Update deliverableData
    if (text.length > oldLen) dd.content = text;
    if (title && (!dd.title || dd.title.length < title.length)) dd.title = title;

    // Add og:image if no images present
    if (ogImage && (!dd.images || dd.images.length === 0)) {
      dd.images = [ogImage];
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { deliverableData: JSON.stringify(dd) },
    });

    console.log(`  Enriched: ${oldLen} -> ${text.length} chars${ogImage ? ', +og:image' : ''}`);
    return true;
  } catch (err) {
    console.log(`  Error: ${err.message}`);
    return false;
  }
}

async function enrichPending() {
  // Find blog/social tasks with short content
  const tasks = await prisma.task.findMany({
    where: {
      category: { in: ['article', 'news', 'social_post'] },
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  let enriched = 0;
  for (const task of tasks) {
    let dd;
    try { dd = JSON.parse(task.deliverableData || '{}'); } catch { dd = {}; }

    // Skip if already has good content
    if ((dd.content || '').length > 500) continue;

    const links = dd.links || [];
    const linkUrl = typeof links[0] === 'string' ? links[0] : links[0]?.url || null;
    if (!linkUrl) continue;

    const did = await enrichTask(task.id);
    if (did) enriched++;
  }

  console.log(`\nEnriched ${enriched} tasks`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--all' || args[0] === '--pending') {
    await enrichPending();
  } else if (args[0]) {
    await enrichTask(args[0]);
  } else {
    console.log('Usage: node enrich-task-content.js <taskId>');
    console.log('       node enrich-task-content.js --all');
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
