import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { catMeta, CATEGORIES } from "@/lib/skill-meta";
import { filterRelevantActivities } from "@/lib/activity-relevance";

export default async function SkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { installations: true } },
      installations: {
        include: {
          activities: {
            select: {
              summary: true,
              body: true,
              contentUrl: true,
              occurredAt: true,
            },
          },
        },
      },
    },
  });

  const activitiesBySkill = new Map<string, { count: number; last: Date | null }>();
  for (const skill of skills) {
    const relevantActivities = filterRelevantActivities(
      skill.installations.flatMap((installation) => installation.activities)
    );

    const last = relevantActivities.reduce<Date | null>(
      (acc, activity) => (!acc || activity.occurredAt > acc ? activity.occurredAt : acc),
      null
    );

    activitiesBySkill.set(skill.id, {
      count: relevantActivities.length,
      last,
    });
  }

  const byCategory = new Map<string, typeof skills>();
  for (const s of skills) {
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  }

  const orderedCats = Object.keys(CATEGORIES).filter((c) => byCategory.has(c));
  for (const c of byCategory.keys()) {
    if (!orderedCats.includes(c)) orderedCats.push(c);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habilidades"
        description="Tudo que seus agentes podem fazer. O contador abaixo considera só execuções úteis, sem logs genéricos."
        actions={
          <Link href="/admin/skills/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nova habilidade
            </Button>
          </Link>
        }
      />

      {skills.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm">Catálogo vazio.</p>
          <Link
            href="/admin/skills/new"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Cadastrar primeira habilidade
          </Link>
        </div>
      ) : (
        orderedCats.map((cat) => {
          const meta = catMeta(cat);
          const items = byCategory.get(cat) ?? [];
          return (
            <section key={cat} className="space-y-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <span aria-hidden className="text-lg">
                    {meta.emoji}
                  </span>
                  {meta.label}
                </h2>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((s) => {
                  const act = activitiesBySkill.get(s.id);
                  return (
                    <Link
                      key={s.id}
                      href={`/admin/skills/${s.id}`}
                      className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{s.name}</span>
                            {s.version ? (
                              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
                                v{s.version}
                              </span>
                            ) : null}
                          </div>
                          <code className="text-[11px] text-muted-foreground">
                            {s.slug}
                          </code>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      {s.description ? (
                        <p className="text-xs text-muted-foreground">
                          {s.description}
                        </p>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {s._count.installations} agente(s) instalaram
                        </span>
                        <span>
                          {act?.count ?? 0} atividade(s) úteis
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
