import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings2,
  Target,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TypeToConfirmButton } from "@/components/type-to-confirm";
import { SyncStatusPill } from "@/components/prospecting/SyncStatusPill";
import { RunNowButton } from "@/components/prospecting/RunNowButton";
import { SyncLeadButton } from "@/components/prospecting/SyncLeadButton";
import { deleteCampaign } from "@/app/actions/prospecting";

export default async function AdminCampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const filter = sp.filter ?? "all";

  const c = await prisma.prospectingCampaign.findUnique({
    where: { id },
    include: {
      tenant: { select: { name: true, slug: true } },
      _count: { select: { leads: true } },
    },
  });
  if (!c) notFound();

  const niches = parseNiches(c.niches);

  const whereLead: any = { campaignId: c.id };
  if (filter !== "all") whereLead.syncStatus = filter;

  const [leads, totals] = await Promise.all([
    prisma.prospectingLead.findMany({
      where: whereLead,
      orderBy: { discoveredAt: "desc" },
      take: 80,
    }),
    prisma.prospectingLead.groupBy({
      by: ["syncStatus"],
      where: { campaignId: c.id },
      _count: { _all: true },
    }),
  ]);

  const totalsByStatus: Record<string, number> = {};
  for (const r of totals) totalsByStatus[r.syncStatus] = r._count._all;

  const deleteThis = async () => {
    "use server";
    await deleteCampaign(c.id, "admin");
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Prospecção", href: "/admin/prospecting" },
          { label: c.name },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente:{" "}
            <Link
              href={`/admin/tenants/${c.tenant.slug}`}
              className="hover:underline"
            >
              {c.tenant.name}
            </Link>
            {" · "}
            HighLevel: {c.ghlLocationId ?? "—"}
            {c.ghlApiKeyHint ? ` · chave …${c.ghlApiKeyHint}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <RunNowButton campaignId={c.id} />
          <Link href={`/admin/prospecting/${c.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </Link>
          <Link href={`/admin/prospecting/${c.id}/mapping`}>
            <Button variant="secondary">
              <Settings2 className="h-4 w-4" /> Mapear
            </Button>
          </Link>
          <TypeToConfirmButton
            action={deleteThis}
            confirmText={c.name}
            triggerLabel="Excluir"
            title={`Excluir "${c.name}"?`}
            impactLines={[`Apagar ${c._count.leads} lead(s)`]}
            ctaLabel={`Excluir ${c.name}`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <InfoCard label="Área" value={c.areaLabel} hint={`raio ${c.radiusKm}km`} />
        <InfoCard label="Nichos" value={`${niches.length}`} hint={niches.slice(0, 2).join(", ")} />
        <InfoCard label="Leads" value={`${c._count.leads}`} hint={`${totalsByStatus.synced ?? 0} sincronizados`} />
        <InfoCard
          label="Próxima busca"
          value={
            c.schedule === "manual"
              ? "Só manual"
              : c.nextRunAt
                ? c.nextRunAt.toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"
          }
          hint={c.schedule}
        />
      </div>

      <section className="rounded-xl border bg-card">
        <div className="flex flex-col gap-2 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold">Leads ({c._count.leads})</h2>
          <div className="flex flex-wrap gap-1">
            {(["all", "synced", "pending", "error"] as const).map((k) => (
              <Link
                key={k}
                href={
                  k === "all"
                    ? `/admin/prospecting/${c.id}`
                    : `/admin/prospecting/${c.id}?filter=${k}`
                }
                className={
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition " +
                  (filter === k
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent")
                }
              >
                {k}{" "}
                <span className="opacity-70">
                  ({k === "all" ? c._count.leads : totalsByStatus[k] ?? 0})
                </span>
              </Link>
            ))}
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhum lead neste filtro.
          </div>
        ) : (
          <ul className="divide-y">
            {leads.map((l) => (
              <li key={l.id} className="px-5 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{l.businessName}</span>
                  {l.niche ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                      {l.niche}
                    </span>
                  ) : null}
                  <SyncStatusPill status={l.syncStatus} />
                </div>
                {l.address || l.city ? (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {[l.address, l.city, l.state].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                  {l.contactName ? <span>{l.contactName}</span> : null}
                  {l.contactEmail ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {l.contactEmail}
                    </span>
                  ) : null}
                  {l.contactPhone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {l.contactPhone}
                    </span>
                  ) : null}
                </div>
                {l.syncStatus !== "synced" ? (
                  <div className="mt-2">
                    <SyncLeadButton leadId={l.id} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function parseNiches(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function InfoCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      {hint ? (
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
