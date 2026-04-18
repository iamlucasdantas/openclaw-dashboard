import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { catMeta } from "@/lib/skill-meta";
import { formatDate } from "@/lib/utils";

export default async function ClientSkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const tenantIds = session.user.tenantIds ?? [];

  const { id } = await params;
  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      installations: {
        where: { agent: { tenantId: { in: tenantIds } } },
        include: {
          agent: { include: { tenant: true } },
          activities: { orderBy: { occurredAt: "desc" }, take: 40 },
        },
      },
    },
  });

  if (!skill) notFound();
  const meta = catMeta(skill.category);

  const allActivities = skill.installations
    .flatMap((i) =>
      i.activities.map((a) => ({ ...a, agent: i.agent }))
    )
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 60);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Meus agentes", href: "/client/agents" },
          { label: skill.name },
        ]}
      />

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
        {skill.description ? (
          <p className="text-sm text-muted-foreground">{skill.description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          label="Seus agentes com esta habilidade"
          value={skill.installations.length.toString()}
        />
        <Card
          label="Atividades recentes (14 dias)"
          value={allActivities.length.toString()}
        />
      </div>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Seus agentes que usam</h2>
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
                  className="font-medium hover:underline"
                >
                  {i.agent.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {i.agent.tenant.name} · {i.activities.length} atividade(s)
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
              Nenhum dos seus agentes usa esta habilidade ainda.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">
            Histórico ({allActivities.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Últimas coisas que seus agentes fizeram usando esta habilidade.
          </p>
        </div>
        <ul className="divide-y">
          {allActivities.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-5 py-3 text-sm">
              <StatusDot status={a.status} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span>{a.summary}</span>
                  <Link
                    href={`/client/agents/${a.agent.agentId}`}
                    className="text-[11px] text-muted-foreground hover:underline"
                  >
                    {a.agent.name}
                  </Link>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {formatDate(a.occurredAt)}
                </div>
              </div>
            </li>
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

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok: "bg-emerald-500",
    error: "bg-destructive",
    warning: "bg-amber-500",
  };
  return (
    <span
      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
        map[status] ?? "bg-muted-foreground/50"
      }`}
    />
  );
}
