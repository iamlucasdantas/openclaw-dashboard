/**
 * Mark tasks as OVERDUE if they've been in started/in_progress for more than 5 days.
 * Run daily via cron.
 * 
 * Usage: node scripts/mark-overdue-tasks.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OVERDAYS_DAYS = 5;

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - OVERDAYS_DAYS);

  const result = await prisma.task.updateMany({
    where: {
      status: { in: ['started', 'in_progress'] },
      startedAt: { lt: cutoff },
    },
    data: {
      status: 'overdue',
    },
  });

  if (result.count > 0) {
    console.log(`[mark-overdue] ${result.count} task(s) marked as OVERDUE (older than ${OVERDAYS_DAYS} days)`);
  } else {
    console.log('[mark-overdue] No overdue tasks found.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
