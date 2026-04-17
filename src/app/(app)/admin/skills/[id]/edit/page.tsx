import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DeleteButton } from "@/components/delete-button";
import { SkillForm } from "../../skill-form";
import { deleteSkill } from "@/app/actions/skills";

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) notFound();

  const deleteThis = async () => {
    "use server";
    await deleteSkill(skill.id);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Skills", href: "/admin/skills" },
          { label: skill.name },
        ]}
      />
      <div className="flex items-start justify-between">
        <PageHeader title={`Editar ${skill.name}`} />
        <form action={deleteThis}>
          <DeleteButton
            message={`Excluir skill "${skill.name}"? Isso desinstala a skill de todos os agentes.`}
          />
        </form>
      </div>
      <SkillForm mode="edit" initial={skill} />
    </div>
  );
}
