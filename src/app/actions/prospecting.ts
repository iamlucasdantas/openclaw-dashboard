"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { audit } from "@/lib/audit";

type Scope = "admin" | "client";

const SCHEDULES = ["daily", "weekly", "manual"] as const;
const STATES = ["active", "paused", "disabled"] as const;

function defaultFieldMap(): Record<string, string> {
  return {
    businessName: "companyName",
    contactName: "firstName",
    contactEmail: "email",
    contactPhone: "phone",
    address: "address1",
    city: "city",
    state: "state",
    websiteUrl: "website",
    gbpUrl: "gbp_url",
    instagramUrl: "instagram",
    facebookUrl: "facebook",
    niche: "niche",
  };
}

const campaignSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  ghlLocationId: z.string().trim().max(120).optional().or(z.literal("")),
  ghlApiKey: z.string().trim().max(300).optional().or(z.literal("")),
  areaLabel: z.string().trim().min(2).max(200),
  radiusKm: z.coerce.number().min(1).max(500).default(10),
  niches: z.string().trim().min(1), // CSV
  filters: z.string().optional(), // JSON serializado ou CSV de flags "gbp,website,..."
  schedule: z.enum(SCHEDULES).default("daily"),
  scheduleTime: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
  autoExpand: z.coerce.boolean().optional().default(true),
  expandAfterDays: z.coerce.number().int().min(1).max(60).default(3),
  expandStepKm: z.coerce.number().min(1).max(100).default(5),
  maxRadiusKm: z.coerce.number().min(5).max(1000).default(100),
});

export type CampaignFormState = {
  error?: string | null;
  fieldErrors?: Record<string, string>;
  success?: string | null;
};

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[issue.path.join(".")] = issue.message;
  return out;
}

function canWriteTenant(
  session: { user: { isAdmin: boolean; tenantIds: string[] } },
  tenantId: string
) {
  if (session.user.isAdmin) return true;
  return (session.user.tenantIds ?? []).includes(tenantId);
}

function parseFilters(raw: string | null | undefined) {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw);
    return typeof p === "object" && p !== null ? p : {};
  } catch {
    // fallback CSV ("gbp,website")
    const out: Record<string, boolean> = {};
    for (const k of raw.split(",").map((x) => x.trim()).filter(Boolean)) {
      out[k] = true;
    }
    return out;
  }
}

export async function createCampaign(
  _prev: CampaignFormState,
  formData: FormData
): Promise<CampaignFormState> {
  const session = await requireSession();
  const parsed = campaignSchema.safeParse({
    tenantId: formData.get("tenantId"),
    name: formData.get("name"),
    ghlLocationId: formData.get("ghlLocationId") ?? "",
    ghlApiKey: formData.get("ghlApiKey") ?? "",
    areaLabel: formData.get("areaLabel"),
    radiusKm: formData.get("radiusKm"),
    niches: formData.get("niches"),
    filters: formData.get("filters") ?? undefined,
    schedule: formData.get("schedule") ?? "daily",
    scheduleTime: formData.get("scheduleTime") ?? "09:00",
    autoExpand: formData.get("autoExpand") === "on" ||
      formData.get("autoExpand") === "true",
    expandAfterDays: formData.get("expandAfterDays") ?? 3,
    expandStepKm: formData.get("expandStepKm") ?? 5,
    maxRadiusKm: formData.get("maxRadiusKm") ?? 100,
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  if (!canWriteTenant(session, parsed.data.tenantId)) {
    return { error: "Você não tem acesso a este cliente." };
  }

  const scope: Scope = session.user.isAdmin ? "admin" : "client";

  const niches = parsed.data.niches
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (niches.length === 0) {
    return { fieldErrors: { niches: "Escolha pelo menos um nicho." } };
  }

  const filtersObj = parseFilters(parsed.data.filters);

  const apiKey = parsed.data.ghlApiKey?.trim() || null;
  const apiKeyHint =
    apiKey && apiKey.length >= 4 ? apiKey.slice(-4) : null;

  const nextRunAt = computeNextRun(parsed.data.schedule, parsed.data.scheduleTime);

  const created = await prisma.prospectingCampaign.create({
    data: {
      tenantId: parsed.data.tenantId,
      name: parsed.data.name,
      ghlLocationId: parsed.data.ghlLocationId || null,
      ghlApiKey: apiKey,
      ghlApiKeyHint: apiKeyHint,
      areaLabel: parsed.data.areaLabel,
      radiusKm: parsed.data.radiusKm,
      niches: JSON.stringify(niches),
      filters: JSON.stringify(filtersObj),
      fieldMap: JSON.stringify(defaultFieldMap()),
      schedule: parsed.data.schedule,
      scheduleTime: parsed.data.scheduleTime,
      nextRunAt,
      autoExpand: parsed.data.autoExpand,
      expandAfterDays: parsed.data.expandAfterDays,
      expandStepKm: parsed.data.expandStepKm,
      maxRadiusKm: parsed.data.maxRadiusKm,
    },
  });

  await audit({
    action: "prospecting.create",
    entityType: "prospecting_campaign",
    entityId: created.id,
    meta: { name: created.name, tenantId: created.tenantId, niches },
  });

  revalidatePath("/client/prospecting");
  revalidatePath("/admin/prospecting");
  redirect(scope === "client" ? `/client/prospecting/${created.id}` : `/admin/prospecting/${created.id}`);
}

export async function updateCampaign(
  id: string,
  _prev: CampaignFormState,
  formData: FormData
): Promise<CampaignFormState> {
  const session = await requireSession();
  const existing = await prisma.prospectingCampaign.findUnique({ where: { id } });
  if (!existing) return { error: "Campanha não encontrada." };
  if (!canWriteTenant(session, existing.tenantId)) {
    return { error: "Acesso negado." };
  }

  const parsed = campaignSchema.safeParse({
    tenantId: existing.tenantId,
    name: formData.get("name"),
    ghlLocationId: formData.get("ghlLocationId") ?? "",
    ghlApiKey: formData.get("ghlApiKey") ?? "",
    areaLabel: formData.get("areaLabel"),
    radiusKm: formData.get("radiusKm"),
    niches: formData.get("niches"),
    filters: formData.get("filters") ?? undefined,
    schedule: formData.get("schedule") ?? "daily",
    scheduleTime: formData.get("scheduleTime") ?? "09:00",
    autoExpand: formData.get("autoExpand") === "on" ||
      formData.get("autoExpand") === "true",
    expandAfterDays: formData.get("expandAfterDays") ?? 3,
    expandStepKm: formData.get("expandStepKm") ?? 5,
    maxRadiusKm: formData.get("maxRadiusKm") ?? 100,
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const niches = parsed.data.niches
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const filtersObj = parseFilters(parsed.data.filters);
  const apiKey = parsed.data.ghlApiKey?.trim();
  const apiKeyHint = apiKey && apiKey.length >= 4 ? apiKey.slice(-4) : null;
  const nextRunAt = computeNextRun(
    parsed.data.schedule,
    parsed.data.scheduleTime
  );

  await prisma.prospectingCampaign.update({
    where: { id },
    data: {
      name: parsed.data.name,
      ghlLocationId: parsed.data.ghlLocationId || null,
      ...(apiKey
        ? { ghlApiKey: apiKey, ghlApiKeyHint: apiKeyHint }
        : {}),
      areaLabel: parsed.data.areaLabel,
      radiusKm: parsed.data.radiusKm,
      niches: JSON.stringify(niches),
      filters: JSON.stringify(filtersObj),
      schedule: parsed.data.schedule,
      scheduleTime: parsed.data.scheduleTime,
      nextRunAt,
      autoExpand: parsed.data.autoExpand,
      expandAfterDays: parsed.data.expandAfterDays,
      expandStepKm: parsed.data.expandStepKm,
      maxRadiusKm: parsed.data.maxRadiusKm,
    },
  });

  await audit({
    action: "prospecting.update",
    entityType: "prospecting_campaign",
    entityId: id,
    meta: { niches, tokenReplaced: !!apiKey },
  });

  revalidatePath(`/client/prospecting/${id}`);
  revalidatePath(`/admin/prospecting/${id}`);
  return { success: "Campanha atualizada." };
}

export async function toggleCampaignState(id: string, nextState: string) {
  const session = await requireSession();
  const existing = await prisma.prospectingCampaign.findUnique({ where: { id } });
  if (!existing) return;
  if (!canWriteTenant(session, existing.tenantId)) throw new Error("Acesso negado.");

  const state = STATES.includes(nextState as any) ? nextState : "active";

  await prisma.prospectingCampaign.update({
    where: { id },
    data: { state },
  });
  await audit({
    action: `prospecting.${state}`,
    entityType: "prospecting_campaign",
    entityId: id,
    meta: { name: existing.name },
  });
  revalidatePath(`/client/prospecting/${id}`);
  revalidatePath(`/admin/prospecting/${id}`);
  revalidatePath("/client/prospecting");
  revalidatePath("/admin/prospecting");
}

export async function deleteCampaign(id: string, scope: Scope = "client") {
  const session = await requireSession();
  const existing = await prisma.prospectingCampaign.findUnique({ where: { id } });
  if (!existing) return;
  if (!canWriteTenant(session, existing.tenantId)) throw new Error("Acesso negado.");

  await prisma.prospectingCampaign.delete({ where: { id } });
  await audit({
    action: "prospecting.delete",
    entityType: "prospecting_campaign",
    entityId: id,
    meta: { name: existing.name },
  });
  revalidatePath("/client/prospecting");
  revalidatePath("/admin/prospecting");
  redirect(scope === "admin" ? "/admin/prospecting" : "/client/prospecting");
}

// Simulação: gera leads fake realistas em vez de chamar Google Places / HL.
export async function simulateRun(id: string) {
  const session = await requireSession();
  const c = await prisma.prospectingCampaign.findUnique({ where: { id } });
  if (!c) throw new Error("Campanha não encontrada.");
  if (!canWriteTenant(session, c.tenantId)) throw new Error("Acesso negado.");

  const niches: string[] = (() => {
    try {
      return JSON.parse(c.niches);
    } catch {
      return [c.niches];
    }
  })();

  const leads = generateFakeLeads(niches, c.areaLabel);

  await prisma.prospectingLead.createMany({
    data: leads.map((l) => ({
      campaignId: c.id,
      businessName: l.businessName,
      niche: l.niche,
      address: l.address,
      city: l.city,
      state: l.state,
      websiteUrl: l.websiteUrl,
      gbpUrl: l.gbpUrl,
      instagramUrl: l.instagramUrl,
      contactName: l.contactName,
      contactEmail: l.contactEmail,
      contactPhone: l.contactPhone,
      syncStatus: l.syncStatus,
      ghlContactId: l.ghlContactId,
      syncedAt: l.syncedAt,
    })),
  });

  await prisma.prospectingCampaign.update({
    where: { id: c.id },
    data: {
      lastRunAt: new Date(),
      nextRunAt: computeNextRun(c.schedule, c.scheduleTime),
    },
  });

  await audit({
    action: "prospecting.run",
    entityType: "prospecting_campaign",
    entityId: c.id,
    meta: { leadsFound: leads.length, areaLabel: c.areaLabel, niches },
  });

  revalidatePath(`/client/prospecting/${id}`);
  revalidatePath(`/admin/prospecting/${id}`);
}

const fieldMapSchema = z.record(z.string(), z.string().max(80));

export async function updateFieldMap(
  id: string,
  mapping: Record<string, string>
) {
  const session = await requireSession();
  const existing = await prisma.prospectingCampaign.findUnique({ where: { id } });
  if (!existing) throw new Error("Campanha não encontrada.");
  if (!canWriteTenant(session, existing.tenantId)) throw new Error("Acesso negado.");

  const parsed = fieldMapSchema.safeParse(mapping);
  if (!parsed.success) throw new Error("Mapeamento inválido.");

  await prisma.prospectingCampaign.update({
    where: { id },
    data: { fieldMap: JSON.stringify(parsed.data) },
  });
  await audit({
    action: "prospecting.mapping",
    entityType: "prospecting_campaign",
    entityId: id,
    meta: { fields: Object.keys(parsed.data).length },
  });
  revalidatePath(`/client/prospecting/${id}/mapping`);
  revalidatePath(`/admin/prospecting/${id}/mapping`);
}

export async function markLeadSynced(leadId: string) {
  const session = await requireSession();
  const lead = await prisma.prospectingLead.findUnique({
    where: { id: leadId },
    include: { campaign: true },
  });
  if (!lead) return;
  if (!canWriteTenant(session, lead.campaign.tenantId)) {
    throw new Error("Acesso negado.");
  }

  await prisma.prospectingLead.update({
    where: { id: leadId },
    data: {
      syncStatus: "synced",
      ghlContactId: "mock_" + Math.random().toString(36).slice(2, 10),
      syncedAt: new Date(),
      syncError: null,
    },
  });

  revalidatePath(`/client/prospecting/${lead.campaignId}`);
  revalidatePath(`/admin/prospecting/${lead.campaignId}`);
}

// ———————— helpers ————————

function computeNextRun(schedule: string, time: string): Date | null {
  if (schedule === "manual") return null;
  const [hh, mm] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hh || 9, mm || 0, 0, 0);
  if (d.getTime() <= Date.now()) {
    if (schedule === "daily") d.setDate(d.getDate() + 1);
    if (schedule === "weekly") d.setDate(d.getDate() + 7);
  } else if (schedule === "weekly") {
    // próxima segunda (dia 1) se o weekly acabou de ser criado
  }
  return d;
}

function generateFakeLeads(niches: string[], area: string) {
  const firstNames = [
    "Ana", "Carla", "Bruna", "Daniela", "Eliana", "Fernanda", "Gabriela",
    "Helena", "Isabela", "Juliana", "Lucas", "Marcos", "Nina", "Paulo",
    "Rafael", "Sofia", "Tiago", "Vitor",
  ];
  const lastNames = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira",
    "Almeida", "Lima", "Gomes", "Costa", "Ribeiro", "Carvalho",
  ];
  const streets = [
    "Rua XV de Novembro", "Av. Sete de Setembro", "Av. Paulista",
    "R. Voluntários da Pátria", "Rua do Sol", "Av. República",
    "R. das Flores", "R. Marechal Deodoro",
  ];
  const brands = [
    "Studio", "Casa", "Espaço", "Espresso", "Bela", "Estilo", "Encanto",
    "Sublime", "Toque", "Charme", "Luz", "Harmonia",
  ];

  const count = 6 + Math.floor(Math.random() * 6); // 6–11 leads
  const leads: any[] = [];
  const [city, stateUf] = (area.includes("-")
    ? area.split("-").map((x) => x.trim())
    : [area, "—"]);

  for (let i = 0; i < count; i++) {
    const niche = niches[Math.floor(Math.random() * niches.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const brandSuffix = niche.split(" ")[0];
    const businessName = `${brand} ${capitalize(brandSuffix)}`;
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = 50 + Math.floor(Math.random() * 2000);
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const slug = `${brand}-${brandSuffix}-${i}`
      .toLowerCase()
      .replace(/\s+/g, "-");

    const hasWebsite = Math.random() > 0.3;
    const hasInsta = Math.random() > 0.2;
    const hasGbp = Math.random() > 0.15;
    const hasPhone = Math.random() > 0.1;

    // 70% sync'd, 20% pending, 10% error
    const roll = Math.random();
    let syncStatus: "synced" | "pending" | "error" = "pending";
    let ghlContactId: string | null = null;
    let syncedAt: Date | null = null;
    if (roll < 0.7) {
      syncStatus = "synced";
      ghlContactId = "mock_" + Math.random().toString(36).slice(2, 10);
      syncedAt = new Date(Date.now() - Math.random() * 3 * 24 * 3600 * 1000);
    } else if (roll < 0.9) {
      syncStatus = "pending";
    } else {
      syncStatus = "error";
    }

    leads.push({
      businessName,
      niche,
      address: `${street}, ${number}`,
      city,
      state: stateUf,
      websiteUrl: hasWebsite ? `https://${slug}.com.br` : null,
      gbpUrl: hasGbp
        ? `https://g.page/${slug}`
        : null,
      instagramUrl: hasInsta ? `https://instagram.com/${slug}` : null,
      contactName: `${first} ${last}`,
      contactEmail: `${first.toLowerCase()}@${slug}.com.br`,
      contactPhone: hasPhone
        ? `(41) 9${Math.floor(8000 + Math.random() * 1999)}-${Math.floor(1000 + Math.random() * 8999)}`
        : null,
      syncStatus,
      ghlContactId,
      syncedAt,
    });
  }

  return leads;
}

function capitalize(s: string) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}
