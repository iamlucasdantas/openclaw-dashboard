import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";
import { CATEGORIES, catMeta } from "@/lib/skill-meta";

export default async function SkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { installations: true } },
    },
  });

  const recentPerSkill = await prisma.skillActivity.groupBy({
    by: ["agentSkillId"],
    _count: { _all: true },
    _max: { occurredAt: true },
  });

  // Precisa mapear agentSkill.skillId para somar por skill
  const installsToSkill = await prisma.agentSkill.findMany({
    select: { id: true, skillId: true },
  });
  const askToSkill = new Map(installsToSkill.map((i) => [i.id, i.skillId]));
  const activitiesBySkill = new Map<string, { count: number; last: Date | null }>();
  for (const r of recentPerSkill) {
    const sk = askToSkill.get(r.agentSkillId);
    if (!sk) continue;
    const cur = activitiesBySkill.get(sk) ?? { count: 0, last: null };
    cur.count += r._count._all;
    if (r._max.occurredAt && (!cur.last || r._max.occurredAt > cur.last)) {
      cur.last = r._max.occurredAt;
    }
    activitiesBySkill.set(sk, cur);
  }

  const byCategory = new Map<string, typeof skills>();
  for (const s of skills) {
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  }

  // ordena categorias conhecidas primeiro
  const orderedCats = Object.keys(CATEGORIES).filter((c) => byCategory.has(c));
  for (const c of byCategory.keys()) {
    if (!orderedCats.includes(c)) orderedCats.push(c);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habilidades"
        description="Tudo que seus agentes podem fazer. Clique em uma habilidade para ver detalhes e histórico."
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
        <div className="rounded-lg border bg-card p-10 text-center">
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
                      className="group rounded-lg border bg-card p-4 transition hover:border-primary hover:shadow-sm"
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
                          {act?.count ?? 0} atividade(s) recentes
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
