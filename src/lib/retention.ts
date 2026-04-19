import { prisma } from "@/lib/prisma";

// Retenção: 30 dias. Mantemos um timestamp em módulo para evitar rodar
// o DELETE a cada request (só roda no máximo 1x por hora).
const RETENTION_DAYS = 30;
const THROTTLE_MS = 60 * 60 * 1000; // 1 hora

let lastRun = 0;

export async function cleanupOldSkillActivities(): Promise<number> {
  const now = Date.now();
  if (now - lastRun < THROTTLE_MS) return 0;
  lastRun = now;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  try {
    const res = await prisma.skillActivity.deleteMany({
      where: { occurredAt: { lt: cutoff } },
    });
    if (res.count > 0) {
      console.log(
        `[retention] removidas ${res.count} SkillActivity(s) anteriores a ${cutoff.toISOString()}`
      );
    }
    return res.count;
  } catch (err) {
    console.error("[retention] erro na limpeza de SkillActivity", err);
    return 0;
  }
}
