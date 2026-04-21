import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings2,
  Target,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TypeToConfirmButton } from "@/components/type-to-confirm";
import { SyncStatusPill } from "@/components/prospecting/SyncStatusPill";
import { RunNowButton } from "@/components/prospecting/RunNowButton";
import { SyncLeadButton } from "@/components/prospecting/SyncLeadButton";
import { deleteCampaign } from "@/app/actions/prospecting";

export default async function ClientCampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const tenantIds = session.user.tenantIds ?? [];

  const { id } = await params;
  const sp = await searchParams;
  const filter = sp.filter ?? "all";

  const c = await prisma.prospectingCampaign.findUnique({
    where: { id },
    include: {
      tenant: { select: { name: true } },
      _count: { select: { leads: true } },
    },
  });
  if (!c) notFound();
  if (!tenantIds.includes(c.tenantId)) notFound();

  const niches = parseNiches(c.niches);

  const whereLead: any = { campaignId: c.id };
  if (filter === "synced") whereLead.syncStatus = "synced";
  if (filter === "pending") whereLead.syncStatus = "pending";
  if (filter === "error") whereLead.syncStatus = "error";

  const [leads, totals] = await Promise.all([
    prisma.prospectingLead.findMany({
      where: whereLead,
      orderBy: { discoveredAt: "desc" },
      take: 50,
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
    await deleteCampaign(c.id, "client");
  };

  const filters: { key: string; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: c._count.leads },
    { key: "synced", label: "Sincronizados", count: totalsByStatus.synced ?? 0 },
    { key: "pending", label: "Pendentes", count: totalsByStatus.pending ?? 0 },
    { key: "error", label: "Com erro", count: totalsByStatus.error ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Prospecção", href: "/client/prospecting" },
          { label: c.name },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Target className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
            <p className="text-sm text-muted-foreground">
              HighLevel · {c.ghlLocationId ?? "—"}
              {c.ghlApiKeyHint ? ` · chave …${c.ghlApiKeyHint}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <RunNowButton campaignId={c.id} />
          <Link href={`/client/prospecting/${c.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </Link>
          <Link href={`/client/prospecting/${c.id}/mapping`}>
            <Button variant="secondary">
              <Settings2 className="h-4 w-4" /> Mapear campos
            </Button>
          </Link>
          <TypeToConfirmButton
            action={deleteThis}
            confirmText={c.name}
            triggerLabel="Excluir campanha"
            title={`Excluir "${c.name}"?`}
            description="A campanha e todos os leads coletados serão apagados."
            impactLines={[
              `Apagar ${c._count.leads} lead(s) coletado(s)`,
              "Parar a busca automática",
              "Não afeta contatos que já foram para o HighLevel",
            ]}
            ctaLabel={`Excluir ${c.name}`}
          />
        </div>
      </div>

      {/* Config rápida */}
      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          icon={<MapPin className="h-4 w-4" />}
          label="Área"
          value={`${c.areaLabel}`}
          hint={`raio ${c.radiusKm} km`}
        />
        <InfoCard
          icon={<Target className="h-4 w-4" />}
          label="Nichos"
          value={`${niches.length}`}
          hint={niches.slice(0, 2).join(", ") + (niches.length > 2 ? ", …" : "")}
        />
        <InfoCard
          icon={<CalendarDays className="h-4 w-4" />}
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
          hint={
            c.schedule === "daily"
              ? `Todo dia às ${c.scheduleTime}`
              : c.schedule === "weekly"
                ? `Toda semana às ${c.scheduleTime}`
                : "Manual"
          }
        />
      </div>

      {/* Filtros de leads */}
      <section className="rounded-xl border bg-card">
        <div className="flex flex-col gap-2 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold">
            Leads ({c._count.leads})
          </h2>
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <Link
                key={f.key}
                href={
                  f.key === "all"
                    ? `/client/prospecting/${c.id}`
                    : `/client/prospecting/${c.id}?filter=${f.key}`
                }
                className={
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition " +
                  (filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent")
                }
              >
                {f.label}{" "}
                <span className="tabular-nums opacity-70">({f.count})</span>
              </Link>
            ))}
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhum lead neste filtro. Clique em{" "}
            <strong>Rodar agora</strong> pra gerar novos.
          </div>
        ) : (
          <ul className="divide-y">
            {leads.map((l) => (
              <LeadRow key={l.id} lead={l} />
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
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold">{value}</div>
      {hint ? (
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

function LeadRow({ lead }: { lead: any }) {
  return (
    <li className="flex flex-col gap-2 px-5 py-3 text-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span aria-hidden>📍</span>
          <span className="font-medium">{lead.businessName}</span>
          {lead.niche ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
              {lead.niche}
            </span>
          ) : null}
          <SyncStatusPill status={lead.syncStatus} />
        </div>

        {lead.address || lead.city ? (
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {[lead.address, lead.city, lead.state]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
          {lead.websiteUrl ? (
            <a
              href={lead.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
            >
              <Globe className="h-3 w-3" aria-hidden /> Site
            </a>
          ) : null}
          {lead.gbpUrl ? (
            <a
              href={lead.gbpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
            >
              <ExternalLink className="h-3 w-3" aria-hidden /> Google
            </a>
          ) : null}
          {lead.instagramUrl ? (
            <a
              href={lead.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
            >
              <Instagram className="h-3 w-3" aria-hidden /> Instagram
            </a>
          ) : null}
          {lead.facebookUrl ? (
            <a
              href={lead.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
            >
              <Facebook className="h-3 w-3" aria-hidden /> Facebook
            </a>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          {lead.contactName ? (
            <span className="font-medium">{lead.contactName}</span>
          ) : null}
          {lead.contactEmail ? (
            <a
              href={`mailto:${lead.contactEmail}`}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-3 w-3" aria-hidden />
              {lead.contactEmail}
            </a>
          ) : null}
          {lead.contactPhone ? (
            <a
              href={`tel:${lead.contactPhone.replace(/\D/g, "")}`}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-3 w-3" aria-hidden />
              {lead.contactPhone}
            </a>
          ) : null}
        </div>

        {lead.ghlContactId ? (
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            ✓ No HighLevel (contact {lead.ghlContactId})
            {lead.syncedAt
              ? ` · em ${new Date(lead.syncedAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : ""}
          </p>
        ) : null}
      </div>

      {lead.syncStatus !== "synced" ? (
        <div className="shrink-0">
          <SyncLeadButton leadId={lead.id} />
        </div>
      ) : null}
    </li>
  );
}
