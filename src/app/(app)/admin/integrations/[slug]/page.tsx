import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ActivityItem } from "@/components/activity-item";
import { cleanupOldSkillActivities } from "@/lib/retention";
import { getIntegrationDetail } from "@/lib/integrations";

export default async function AdminIntegrationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await cleanupOldSkillActivities();

  const { slug } = await params;
  const skill = await getIntegrationDetail(slug);
  if (!skill) notFound();

  const activities = skill.installations
    .flatMap((i) =>
      i.activities.map((a) => ({
        id: a.id,
        summary: a.summary,
        body: a.body,
        contentType: a.contentType,
        contentUrl: a.contentUrl,
        status: a.status,
        occurredAt: a.occurredAt,
        agent: { agentId: i.agent.agentId, name: i.agent.name },
      }))
    )
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 200);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Integrações", href: "/admin/integrations" },
          { label: skill.name },
        ]}
      />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{skill.name}</h1>
        {skill.description ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {skill.description}
          </p>
        ) : null}
      </header>

      <section className="rounded-xl border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            Agentes que usam ({skill.installations.length})
          </h2>
        </div>
        <ul className="divide-y">
          {skill.installations.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <div>
                <Link
                  href={`/admin/agents/${i.agent.agentId}`}
                  className="font-medium hover:underline"
                >
                  {i.agent.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  <Link
                    href={`/admin/tenants/${i.agent.tenant.slug}`}
                    className="hover:underline"
                  >
                    {i.agent.tenant.name}
                  </Link>
                  {" · "}
                  {i.activities.length} atividade(s) relevante(s)
                </div>
              </div>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs " +
                  (i.enabled
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                    : "bg-muted text-muted-foreground")
                }
              >
                {i.enabled ? "ativa" : "desligada"}
              </span>
            </li>
          ))}
          {skill.installations.length === 0 && (
            <li className="px-5 py-8 text-center text-xs text-muted-foreground">
              Nenhum agente ainda.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            Histórico consolidado ({activities.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Mostrando só atividade útil, sem placeholders genéricos.
          </p>
        </div>
        <ul className="divide-y">
          {activities.map((a) => (
            <ActivityItem
              key={a.id}
              a={a}
              agentHrefPrefix="/admin/agents"
              density="expanded"
            />
          ))}
          {activities.length === 0 && (
            <li className="px-5 py-10 text-center text-xs text-muted-foreground">
              Nenhuma atividade útil registrada no período.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
