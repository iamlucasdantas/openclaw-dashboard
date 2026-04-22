import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ActivityItem } from "@/components/activity-item";
import { cleanupOldSkillActivities } from "@/lib/retention";
import { getIntegrationDetail } from "@/lib/integrations";

export default async function ClientIntegrationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await cleanupOldSkillActivities();

  const session = await auth();
  if (!session?.user) redirect("/login");
  const tenantIds = session.user.tenantIds ?? [];

  const { slug } = await params;
  const skill = await getIntegrationDetail(slug, tenantIds);
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
    .slice(0, 120);

  const mediaCount = activities.filter(
    (a) => a.contentType === "image" && a.contentUrl
  ).length;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Integrações", href: "/client/integrations" },
          { label: skill.name },
        ]}
      />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {skill.name}
          </h1>
          {skill.description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {skill.description}
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Assistentes conectados"
          value={skill.installations.length.toString()}
        />
        <Stat
          label="Atividades relevantes (30 dias)"
          value={activities.length.toString()}
        />
        <Stat
          label="Com imagem"
          value={mediaCount.toString()}
          hint={mediaCount > 0 ? "no histórico abaixo" : undefined}
        />
      </div>

      <section className="rounded-xl border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Assistentes que usam</h2>
        </div>
        <ul className="divide-y">
          {skill.installations.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <div>
                <Link
                  href={`/client/agents/${i.agent.agentId}`}
                  className="font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {i.agent.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {i.agent.tenant.name} · {i.activities.length} atividade(s) relevante(s)
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
              Nenhum assistente usa esta integração ainda.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            O que foi feito nos últimos 30 dias
          </h2>
          <p className="text-xs text-muted-foreground">
            Só atividades úteis, sem placeholders genéricos.
          </p>
        </div>
        <ul className="divide-y">
          {activities.map((a) => (
            <ActivityItem
              key={a.id}
              a={a}
              agentHrefPrefix="/client/agents"
              density="expanded"
            />
          ))}
          {activities.length === 0 && (
            <li className="px-5 py-10 text-center text-xs text-muted-foreground">
              Nenhuma atividade útil registrada pra esta integração no período.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
