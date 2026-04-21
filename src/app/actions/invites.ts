"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { signIn } from "@/auth";
import { audit } from "@/lib/audit";

const DAYS_7_MS = 7 * 24 * 60 * 60 * 1000;

const createInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  isAdmin: z.coerce.boolean().optional().default(false),
  tenantId: z.string().optional(),
});

export type InviteFormState = {
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[issue.path.join(".")] = issue.message;
  return out;
}

export async function createInvite(
  _prev: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const session = await requireAdmin();

  const rawTenant = (formData.get("tenantId") ?? "").toString();
  const parsed = createInviteSchema.safeParse({
    email: formData.get("email"),
    isAdmin: formData.get("isAdmin") === "on",
    tenantId: rawTenant || undefined,
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  if (!parsed.data.isAdmin && !parsed.data.tenantId) {
    return {
      error: "Selecione um cliente ou marque 'admin'. Um convite precisa dar algum acesso.",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return {
      fieldErrors: {
        email: "Já existe um usuário com este email. Gerencie pela página de usuários.",
      },
    };
  }

  const token = randomBytes(24).toString("base64url");

  const created = await prisma.invite.create({
    data: {
      email: parsed.data.email,
      token,
      isAdmin: parsed.data.isAdmin,
      tenantId: parsed.data.tenantId || null,
      createdBy: session.user.id,
      expiresAt: new Date(Date.now() + DAYS_7_MS),
    },
  });

  await audit({
    action: "invite.create",
    entityType: "invite",
    entityId: created.id,
    meta: {
      email: created.email,
      isAdmin: created.isAdmin,
      tenantId: created.tenantId,
    },
  });

  revalidatePath("/admin/invites");
  redirect("/admin/invites");
}

export async function revokeInvite(id: string) {
  await requireAdmin();
  const before = await prisma.invite.findUnique({ where: { id } });
  await prisma.invite.delete({ where: { id } });
  await audit({
    action: "invite.revoke",
    entityType: "invite",
    entityId: id,
    meta: before ? { email: before.email, tenantId: before.tenantId } : null,
  });
  revalidatePath("/admin/invites");
}

const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(200),
});

export type AcceptInviteState = {
  error?: string | null;
  fieldErrors?: Record<string, string>;
};

export async function acceptInvite(
  _prev: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  const parsed = acceptSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const invite = await prisma.invite.findUnique({
    where: { token: parsed.data.token },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { error: "Convite inválido ou expirado." };
  }

  // Se por acaso um usuário com este email já foi criado desde que o convite
  // foi emitido, rejeita para evitar sobrescrita.
  const dup = await prisma.user.findUnique({ where: { email: invite.email } });
  if (dup) {
    return { error: "Já existe uma conta com este email. Faça login." };
  }

  const newUserId = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: invite.email,
        name: parsed.data.name,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        isAdmin: invite.isAdmin,
      },
    });

    if (invite.tenantId) {
      await tx.membership.create({
        data: { userId: user.id, tenantId: invite.tenantId },
      });
    }

    await tx.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return user.id;
  });

  await audit({
    action: "invite.accept",
    entityType: "invite",
    entityId: invite.id,
    meta: {
      email: invite.email,
      newUserId,
      tenantId: invite.tenantId,
      isAdmin: invite.isAdmin,
    },
  });

  // Sign in automatically
  await signIn("credentials", {
    email: invite.email,
    password: parsed.data.password,
    redirectTo: "/",
  });

  return { error: null };
}
