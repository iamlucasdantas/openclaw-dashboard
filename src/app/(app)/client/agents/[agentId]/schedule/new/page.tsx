import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { copy } from "@/lib/copy";
import { ScheduleWizard } from "@/components/schedule-wizard/ScheduleWizard";

export default async function ClientScheduleNewPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { agentId } = await params;
  const agent = await prisma.agent.findUnique({ where: { agentId } });
  if (!agent) notFound();
  if (!(session.user.tenantIds ?? []).includes(agent.tenantId)) notFound();

  const backHref = `/client/agents/${agent.agentId}?tab=connections`;

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
          Para o assistente <span className="font-medium">{agent.name}</span>.
        </p>
      </div>

      <ScheduleWizard
        agentDbId={agent.id}
        agentName={agent.name}
        scope="client"
        cancelHref={backHref}
      />
    </div>
  );
}
