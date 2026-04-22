import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/form";
import { AgentForm } from "../agent-form";
import { AgentTemplatesGallery } from "@/components/agent-templates-gallery";
import { getTemplate } from "@/lib/agent-templates";

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; template?: string; scratch?: string }>;
}) {
  const params = await searchParams;
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const defaultTenant = params.tenant
    ? tenants.find((t) => t.slug === params.tenant)
    : undefined;

  const template = getTemplate(params.template);
  const unknownTemplate =
    params.template !== undefined && params.template !== "" && !template;
  const showForm = !!template || params.scratch !== undefined;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agents"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden /> Voltar
      </Link>
      <PageHeader
        title={template ? `Novo agente — ${template.name}` : "Novo agente"}
        description={
          template
            ? `${template.emoji} ${template.shortDescription}`
            : "Escolha um modelo ou comece do zero."
        }
      />
      {unknownTemplate ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Template <code>{params.template}</code> não foi encontrado. Escolha
          um modelo abaixo ou clique em <strong>criar do zero</strong>.
        </div>
      ) : null}

      {showForm ? (
        <AgentForm
          mode="create"
          tenants={tenants}
          defaultTenantId={defaultTenant?.id}
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
          basePath="/admin/agents/new"
          scratchHref={
            params.tenant
              ? `/admin/agents/new?scratch&tenant=${params.tenant}`
              : "/admin/agents/new?scratch"
          }
        />
      )}
    </div>
  );
}
