import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { AgentForm } from "@/app/(app)/admin/agents/agent-form";
import { AgentTemplatesGallery } from "@/components/agent-templates-gallery";
import { getTemplate } from "@/lib/agent-templates";

export default async function NewClientAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; scratch?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantIds = session.user.tenantIds ?? [];
  if (tenantIds.length === 0) redirect("/client");

  const sp = await searchParams;
  const template = getTemplate(sp.template);
  const showForm = !!template || sp.scratch !== undefined;

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/client/agents"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden /> Voltar
      </Link>

      <PageHeader
        title={
          template ? `Novo assistente — ${template.name}` : "Novo assistente"
        }
        description={
          template
            ? `${template.emoji} ${template.shortDescription}`
            : "Escolha um modelo ou crie do zero."
        }
      />

      {showForm ? (
        <AgentForm
          mode="create"
          scope="client"
          tenants={tenants}
          defaultTenantId={tenants[0]?.id}
          cancelHref="/client/agents"
          templateDefaults={
            template
              ? {
                  name: template.name,
                  persona: template.persona,
                  model: template.model,
                  skillSlugs: template.skillSlugs,
                }
              : undefined
          }
        />
      ) : (
        <AgentTemplatesGallery
          basePath="/client/agents/new"
          scratchHref="/client/agents/new?scratch"
        />
      )}
    </div>
  );
}
