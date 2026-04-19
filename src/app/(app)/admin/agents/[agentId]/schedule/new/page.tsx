import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { copy } from "@/lib/copy";
import { ScheduleWizard } from "@/components/schedule-wizard/ScheduleWizard";

export default async function AdminScheduleNewPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await prisma.agent.findUnique({ where: { agentId } });
  if (!agent) notFound();

  const backHref = `/admin/agents/${agent.agentId}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        Voltar para {agent.name}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.schedule.wizard.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          Agendando para <span className="font-medium">{agent.name}</span> (
          <code className="text-[11px]">{agent.agentId}</code>).
        </p>
      </div>

      <ScheduleWizard
        agentDbId={agent.id}
        agentName={agent.name}
        scope="admin"
        cancelHref={backHref}
      />
    </div>
  );
}
