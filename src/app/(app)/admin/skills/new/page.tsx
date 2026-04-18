import { PageHeader } from "@/components/form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SkillForm } from "../skill-form";

export default function NewSkillPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Skills", href: "/admin/skills" }, { label: "Nova" }]} />
      <PageHeader title="Nova skill" description="Adicione uma skill ao catálogo global." />
      <SkillForm mode="create" />
    </div>
  );
}
