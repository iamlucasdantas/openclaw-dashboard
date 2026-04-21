import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ActivityItem } from "@/components/activity-item";
import { catMeta } from "@/lib/skill-meta";
import { cleanupOldSkillActivities } from "@/lib/retention";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await cleanupOldSkillActivities();

  const { id } = await params;

  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      installations: {
        include: {
          agent: { include: { tenant: true } },
          activities: {
            orderBy: { occurredAt: "desc" },
            take: 60,
          },
        },
      },
    },
  });

  if (!skill) notFound();
  const meta = catMeta(skill.category);

  // Junta todas as atividades de todas as installations, ordenadas por data
  const allActivities = skill.installations
    .flatMap((i) =>
      i.activities.map((a) => ({
        ...a,
        agent: {
          agentId: i.agent.agentId,
          name: i.agent.name,
        },
      }))
    )
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 100);

  const statusCounts = allActivities.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Habilidades", href: "/admin/skills" },
          { label: skill.name },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span aria-hidden className="text-xl">
              {meta.emoji}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">{skill.name}</h1>
            {skill.version ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                v{skill.version}
              </span>
            ) : null}
            <span className={`rounded-full px-2 py-0.5 text-xs ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {skill.slug}
            </code>
            {skill.source ? ` · fonte: ${skill.source}` : null}
          </p>
          {skill.description ? (
            <p className="mt-2 max-w-2xl text-sm">{skill.description}</p>
          ) : null}
        </div>
        <Link href={`/admin/skills/${skill.id}/edit`}>
          <Button variant="secondary">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Agentes com esta habilidade" value={skill.installations.length.toString()} />
        <Card
          label="Ativas"
          value={skill.installations.filter((i) => i.enabled).length.toString()}
        />
        <Card
          label="Atividades (30 dias)"
          value={allActivities.length.toString()}
          hint={
            statusCounts.error
              ? `${statusCounts.error} com erro`
              : statusCounts.warning
                ? `${statusCounts.warning} com aviso`
                : "todas ok"
          }
        />
      </div>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Agentes que usam esta habilidade</h2>
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
                  {i.activities.length} atividade(s)
                </div>
              </div>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs " +
                  (i.enabled
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
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

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            Histórico de atividades ({allActivities.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Últimos 30 dias. Clique em cada linha para abrir o conteúdo.
            Atividades mais antigas são removidas automaticamente.
          </p>
        </div>
        <ul className="divide-y">
          {allActivities.map((a) => (
            <ActivityItem
              key={a.id}
              a={a}
              agentHrefPrefix="/admin/agents"
            />
          ))}
          {allActivities.length === 0 && (
            <li className="px-5 py-8 text-center text-xs text-muted-foreground">
              Ainda não há atividades registradas.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
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
