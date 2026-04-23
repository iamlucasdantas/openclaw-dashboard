import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Agent ID mapping (OpenClaw agentId -> dashboard agentId)
const AGENT_MAP: Record<string, string> = {
  'claw-dantas': 'claw-dantas',
  'clawdantas': 'claw-dantas',
  'axxion': 'axxion',
  'wrexham': 'wrexham',
};

const VALID_CATEGORIES = ['article', 'news', 'social_post', 'carousel', 'crm', 'wordpress_update', 'other'];
const VALID_STATUSES = ['started', 'in_progress', 'completed', 'failed', 'overdue'];

const DASHBOARD_KEY = process.env.DASHBOARD_API_KEY || 'changeme';

function authenticate(request: Request): boolean {
  const key = request.headers.get('x-dashboard-key');
  return key === DASHBOARD_KEY;
}

// POST /api/agents/tasks — Create a new task
export async function POST(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agentId, title, category, status, deliverableData } = body;

    if (!agentId || !title) {
      return NextResponse.json({ error: 'agentId and title are required' }, { status: 400 });
    }

    const mappedAgentId = AGENT_MAP[agentId.toLowerCase()];
    if (!mappedAgentId) {
      return NextResponse.json({ error: `Unknown agentId: ${agentId}. Valid: claw-dantas, axxion, wrexham` }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({ where: { agentId: mappedAgentId } });
    if (!agent) {
      return NextResponse.json({ error: `Agent not found in DB: ${mappedAgentId}` }, { status: 404 });
    }

    const taskCategory = VALID_CATEGORIES.includes(category) ? category : 'other';
    const taskStatus = VALID_STATUSES.includes(status) ? status : 'started';
    const dd = deliverableData || {};

    // Extract result fields from deliverableData
    const images = dd.images || [];
    const links = dd.links || [];
    const resultUrl = typeof images?.[0] === 'string' ? images[0]
      : images?.[0]?.url
      || (typeof links?.[0] === 'string' ? links[0] : links?.[0]?.url)
      || null;
    const resultType = images.length > 0 ? 'image' : links.length > 0 ? 'link' : 'text';
    const resultSummary = dd.content
      ? (dd.content as string).slice(0, 200)
      : dd.caption
        ? (dd.caption as string).slice(0, 200)
        : null;

    const now = new Date();
    const task = await prisma.task.create({
      data: {
        agentId: agent.id,
        title: title.slice(0, 255),
        status: taskStatus,
        category: taskCategory,
        result: resultSummary,
        resultType,
        resultUrl,
        deliverableData: JSON.stringify(dd),
        startedAt: now,
        resolvedAt: taskStatus === 'completed' ? now : null,
      },
    });

    return NextResponse.json({ ok: true, task: { id: task.id, title: task.title, status: task.status, category: task.category } }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/agents/tasks]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/agents/tasks?id=xxx — Update task status
export async function PATCH(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    const body = await request.json();
    const { status, deliverableData } = body;

    const update: Record<string, any> = {};
    if (status && VALID_STATUSES.includes(status)) {
      update.status = status;
      if (status === 'completed') update.resolvedAt = new Date();
    }
    if (deliverableData) {
      update.deliverableData = typeof deliverableData === 'string' ? deliverableData : JSON.stringify(deliverableData);

      // Update result fields
      const dd = typeof deliverableData === 'string' ? JSON.parse(deliverableData) : deliverableData;
      const images = dd.images || [];
      const links = dd.links || [];
      if (images.length > 0) {
        update.resultUrl = typeof images[0] === 'string' ? images[0] : images[0]?.url;
        update.resultType = 'image';
      }
      if (dd.content) update.result = (dd.content as string).slice(0, 200);
      if (dd.caption && !dd.content) update.result = (dd.caption as string).slice(0, 200);
    }

    const task = await prisma.task.update({
      where: { id },
      data: update,
    });

    return NextResponse.json({ ok: true, task: { id: task.id, title: task.title, status: task.status, category: task.category } });
  } catch (err: any) {
    console.error('[PATCH /api/agents/tasks]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/agents/tasks?agentId=xxx — List tasks
export async function GET(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);

    const where: Record<string, any> = {};
    if (agentId) {
      const mapped = AGENT_MAP[agentId.toLowerCase()];
      if (mapped) {
        const agent = await prisma.agent.findUnique({ where: { agentId: mapped } });
        if (agent) where.agentId = agent.id;
      }
    }
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        agent: { select: { agentId: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, tasks });
  } catch (err: any) {
    console.error('[GET /api/agents/tasks]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
