import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
};

// Grava um evento de auditoria. Anexa quem é o ator a partir da sessão atual.
export async function audit(input: AuditInput) {
  const session = await auth().catch(() => null);
  const actor = session?.user;

  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? null,
        actorEmail: actor?.email ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        meta: input.meta ? JSON.stringify(input.meta) : null,
      },
    });
  } catch (err) {
    // auditoria nunca quebra a action principal
    console.error("[audit] falha ao gravar evento", err);
  }
}
