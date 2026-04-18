import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";

export default async function SkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { _count: { select: { installations: true } } },
  });

  const byCategory = new Map<string, typeof skills>();
  for (const s of skills) {
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills"
        description="Catálogo global. Cada agente instala as skills que precisa."
        actions={
          <Link href="/admin/skills/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nova skill
            </Button>
          </Link>
        }
      />

      {skills.length === 0 ? (
        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <tbody>
              <EmptyState
                colSpan={1}
                icon={<Sparkles className="h-5 w-5" />}
                title="Catálogo vazio"
                description="Cadastre uma skill para disponibilizar aos agentes."
                action={{ label: "Nova skill", href: "/admin/skills/new" }}
              />
            </tbody>
          </table>
        </div>
      ) : (
        [...byCategory.entries()].map(([cat, items]) => (
          <section key={cat} className="rounded-lg border bg-card">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold capitalize">{cat}</h2>
            </div>
            <ul className="divide-y">
              {items.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/skills/${s.id}/edit`}
                        className="text-sm font-medium hover:underline"
                      >
                        {s.name}
                      </Link>
                      <code className="text-[11px] text-muted-foreground">{s.slug}</code>
                      {s.version ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                          v{s.version}
                        </span>
                      ) : null}
                    </div>
                    {s.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.description}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      fonte: {s.source ?? "—"} · {s._count.installations} agente(s)
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
