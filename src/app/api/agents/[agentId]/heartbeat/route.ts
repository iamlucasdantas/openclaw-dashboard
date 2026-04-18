import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    version: z.string().trim().max(80).optional(),
    status: z.enum(["online", "offline", "degraded"]).optional(),
  })
  .passthrough();

function unauth(reason: string) {
  return NextResponse.json(
    { ok: false, error: reason },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  const authz = req.headers.get("authorization") ?? "";
  const match = authz.match(/^Bearer\s+(.+)$/i);
  if (!match) return unauth("Bearer token ausente.");
  const presented = match[1].trim();

  const agent = await prisma.agent.findUnique({ where: { agentId } });
  if (!agent || !agent.heartbeatSecret) {
    return unauth("Agente não reconhecido.");
  }
  if (presented !== agent.heartbeatSecret) {
    return unauth("Token inválido.");
  }

  let payload: z.infer<typeof bodySchema> = {};
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (parsed.success) payload = parsed.data;
  } catch {
    // body vazio ou não-JSON é ok
  }

  const now = new Date();
  const updated = await prisma.agent.update({
    where: { id: agent.id },
    data: {
      lastHeartbeatAt: now,
      lastVersion: payload.version ?? agent.lastVersion,
      status: payload.status ?? (agent.status === "degraded" ? agent.status : "online"),
    },
    select: { agentId: true, lastHeartbeatAt: true, status: true, lastVersion: true },
  });

  return NextResponse.json({ ok: true, agent: updated });
}
