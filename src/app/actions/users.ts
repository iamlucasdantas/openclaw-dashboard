"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth-guards";
import { audit } from "@/lib/audit";

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Mínimo 8 caracteres").max(200),
  isAdmin: z.coerce.boolean().optional().default(false),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  isAdmin: z.coerce.boolean().optional().default(false),
});

const passwordSchema = z.object({
  password: z.string().min(8).max(200),
});

export type UserFormState = {
  error?: string | null;
  fieldErrors?: Record<string, string>;
  success?: string | null;
};

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[issue.path.join(".")] = issue.message;
  return out;
}

export async function createUser(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    isAdmin: formData.get("isAdmin") === "on",
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  let userId: string;
  try {
    const created = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        isAdmin: parsed.data.isAdmin,
      },
    });
    userId = created.id;
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { fieldErrors: { email: "Já existe um usuário com este email." } };
    }
    return { error: "Erro ao criar usuário." };
  }

  await audit({
    action: "user.create",
    entityType: "user",
    entityId: userId,
    meta: {
      name: parsed.data.name,
      email: parsed.data.email,
      isAdmin: parsed.data.isAdmin,
    },
  });

  revalidatePath("/admin/users");
  redirect(`/admin/users/${userId}`);
}

export async function updateUser(
  id: string,
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();
  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    isAdmin: formData.get("isAdmin") === "on",
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  if (session.user.id === id && !parsed.data.isAdmin) {
    return { error: "Você não pode remover sua própria role de admin." };
  }

  const before = await prisma.user.findUnique({ where: { id } });

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        isAdmin: parsed.data.isAdmin,
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { fieldErrors: { email: "Email já usado por outro usuário." } };
    }
    return { error: "Erro ao atualizar usuário." };
  }

  await audit({
    action: "user.update",
    entityType: "user",
    entityId: id,
    meta: {
      before: before
        ? { name: before.name, email: before.email, isAdmin: before.isAdmin }
        : null,
      after: {
        name: parsed.data.name,
        email: parsed.data.email,
        isAdmin: parsed.data.isAdmin,
      },
    },
  });

  revalidatePath("/admin/users");
  return { success: "Alterações salvas." };
}

export async function setUserPassword(
  id: string,
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) },
  });

  await audit({
    action: "user.password_reset",
    entityType: "user",
    entityId: id,
    meta: { by: "admin" },
  });

  return { success: "Senha redefinida." };
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (session.user.id === id) {
    throw new Error("Você não pode excluir sua própria conta.");
  }
  const before = await prisma.user.findUnique({ where: { id } });
  await prisma.user.delete({ where: { id } });
  await audit({
    action: "user.delete",
    entityType: "user",
    entityId: id,
    meta: before ? { name: before.name, email: before.email } : null,
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

const membershipSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
});

export async function addMembership(formData: FormData) {
  await requireAdmin();
  const parsed = membershipSchema.safeParse({
    userId: formData.get("userId"),
    tenantId: formData.get("tenantId"),
  });
  if (!parsed.success) return;

  await prisma.membership.upsert({
    where: {
      userId_tenantId: {
        userId: parsed.data.userId,
        tenantId: parsed.data.tenantId,
      },
    },
    update: {},
    create: parsed.data,
  });

  await audit({
    action: "membership.add",
    entityType: "membership",
    entityId: `${parsed.data.userId}:${parsed.data.tenantId}`,
    meta: parsed.data,
  });

  revalidatePath(`/admin/users/${parsed.data.userId}`);
}

export async function removeMembership(userId: string, tenantId: string) {
  await requireAdmin();
  await prisma.membership.delete({
    where: { userId_tenantId: { userId, tenantId } },
  });
  await audit({
    action: "membership.remove",
    entityType: "membership",
    entityId: `${userId}:${tenantId}`,
    meta: { userId, tenantId },
  });
  revalidatePath(`/admin/users/${userId}`);
}

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
});
const selfPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: z.string().min(8, "Mínimo 8 caracteres").max(200),
});

export async function updateOwnProfile(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const before = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  await audit({
    action: "profile.update",
    entityType: "user",
    entityId: session.user.id,
    meta: { before: { name: before?.name }, after: { name: parsed.data.name } },
  });

  revalidatePath("/client/profile");
  return { success: "Perfil atualizado." };
}

export async function changeOwnPassword(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireSession();
  const parsed = selfPasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) return { error: "Usuário não encontrado." };

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return { fieldErrors: { currentPassword: "Senha atual incorreta." } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });

  await audit({
    action: "profile.password_change",
    entityType: "user",
    entityId: user.id,
    meta: null,
  });

  return { success: "Senha alterada." };
}
