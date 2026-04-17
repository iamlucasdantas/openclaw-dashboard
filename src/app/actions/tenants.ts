"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

const tenantSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(slugRegex, "Slug: 3-50 chars, apenas a-z, 0-9 e '-'"),
  description: z.string().trim().max(300).optional().or(z.literal("")),
});

export type TenantFormState = {
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  return tenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
  });
}

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    out[issue.path.join(".")] = issue.message;
  }
  return out;
}

export async function createTenant(
  _prev: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    await prisma.tenant.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { fieldErrors: { slug: "Já existe um cliente com este slug." } };
    }
    return { error: "Erro ao criar cliente." };
  }

  revalidatePath("/admin/tenants");
  redirect(`/admin/tenants/${parsed.data.slug}`);
}

export async function updateTenant(
  id: string,
  _prev: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    await prisma.tenant.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { fieldErrors: { slug: "Slug já usado por outro cliente." } };
    }
    return { error: "Erro ao atualizar cliente." };
  }

  revalidatePath("/admin/tenants");
  redirect(`/admin/tenants/${parsed.data.slug}`);
}

export async function deleteTenant(id: string) {
  await requireAdmin();
  await prisma.tenant.delete({ where: { id } });
  revalidatePath("/admin/tenants");
  redirect("/admin/tenants");
}
