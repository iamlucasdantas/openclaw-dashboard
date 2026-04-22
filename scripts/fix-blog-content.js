#!/usr/bin/env node
/**
 * fix-blog-content.js — Update truncated blog content in dashboard DB
 * Fetches full content from live WordPress URLs
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const https = require('https');
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractContent(html) {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                       html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                       [null, html];
  let text = articleMatch[1] || html;
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '- ');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&#8217;/g, "'").replace(/&#8211;/g, '-').replace(/&#8212;/g, '—')
    .replace(/&#8220;|&#8221;/g, '"').replace(/&#038;/g, '&').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  text = text.replace(/\r/g, '').replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

const BLOG_UPDATES = [
  {
    id: 'cmo9900dk0007271bq78784wp',
    url: 'https://thebeautybarqc.com/botox-davenport-iowa/',
    title: 'Botox in Davenport, Iowa: Pricing, What to Expect & Where to Go in 2026',
  },
  {
    id: 'cmo9900dg0005271byd67qmxb',
    url: 'https://thebeautybarqc.com/semaglutide-weight-loss-quad-cities/',
    title: 'Semaglutide Weight Loss in the Quad Cities: What You Need to Know',
  },
  {
    id: 'cmo9900dc0003271bfpf482vv',
    url: 'https://thebeautybarqc.com/lip-filler-natural-results-vs-overfilled-davenport-iowa/',
    title: 'Lip Filler Near Davenport, Iowa: Natural Results vs. The Overfilled Look',
  },
];

async function run() {
  for (const blog of BLOG_UPDATES) {
    try {
      console.log('Fetching: ' + blog.url);
      const html = await fetchUrl(blog.url);
      const fullContent = extractContent(html);
      console.log('  Extracted ' + fullContent.length + ' chars');
      const task = await p.task.findUnique({ where: { id: blog.id } });
      if (!task) {
        console.log('  SKIP: Task not found');
        continue;
      }
      const dd = JSON.parse(task.deliverableData || '{}');
      const oldLen = (dd.content || '').length;
      dd.content = fullContent;
      dd.title = blog.title;
      await p.task.update({
        where: { id: blog.id },
        data: { deliverableData: JSON.stringify(dd) },
      });
      console.log('  UPDATED: ' + oldLen + ' -> ' + fullContent.length + ' chars');
    } catch (err) {
      console.error('  ERROR: ' + err.message);
    }
  }
  await p.$disconnect();
  console.log('Done!');
}

run();
