import { Plug } from "lucide-react";
import { PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { IntegrationCard } from "@/components/integration-card";
import { listIntegrations } from "@/lib/integrations";

export default async function AdminIntegrationsPage() {
  const integrations = await listIntegrations();

  const connected = integrations.filter((i) => i.agentsCount > 0);
  const available = integrations.filter((i) => i.agentsCount === 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        description="Todos os serviços externos conectados aos agentes da infraestrutura."
      />

      {integrations.length === 0 ? (
        <EmptyState
          icon={<Plug className="h-5 w-5" />}
          title="Nenhuma integração disponível"
          description="Nenhuma skill da categoria 'integration' no catálogo."
        />
      ) : (
        <>
          {connected.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold">
                Em uso ({connected.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {connected.map((i) => (
                  <IntegrationCard
                    key={i.id}
                    basePath="/admin/integrations"
                    slug={i.slug}
                    name={i.name}
                    description={i.description}
                    version={i.version}
                    agentsCount={i.agentsCount}
                    totalActivities={i.totalActivities}
                    todayActivities={i.todayActivities}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {available.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                No catálogo, sem uso ({available.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {available.map((i) => (
                  <IntegrationCard
                    key={i.id}
                    basePath="/admin/integrations"
                    slug={i.slug}
                    name={i.name}
                    description={i.description}
                    version={i.version}
                    agentsCount={i.agentsCount}
                    totalActivities={i.totalActivities}
                    todayActivities={i.todayActivities}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
