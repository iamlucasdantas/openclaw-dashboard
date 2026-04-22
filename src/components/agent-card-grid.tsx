import Link from "next/link";
import { ArrowUpRight, Bot, Calendar, Clock3, Cpu, Radio, Sparkles, Zap } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import type { EffectiveStatus } from "@/lib/agent-status";

function AgentAvatar({ name, agentKey }: { name: string; agentKey: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  let hash = 0;
  for (let i = 0; i < agentKey.length; i++) hash = agentKey.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;

  return (
    <div className="relative h-20 w-20 shrink-0 rounded-2xl">
      <div
        className="absolute inset-0 flex items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, hsl(${hue} 72% 54%), hsl(${(hue + 40) % 360} 70% 38%))` }}
      >
        {initials || <Bot className="h-7 w-7" />}
      </div>
      <div
        className="absolute inset-[2px] rounded-[14px] bg-cover bg-center"
        style={{ backgroundImage: `url(/api/media/openclaw/telegram-avatars/${agentKey}.jpg)` }}
      />
      <div className="absolute inset-[2px] rounded-[14px] bg-gradient-to-t from-slate-950/45 via-transparent to-white/10" />
      <div className="absolute -inset-px rounded-2xl border border-white/15" />
    </div>
  );
}

function relativeTime(date: Date | null): string {
  if (!date) return "sem heartbeat";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days} d atrás`;
}

type AgentCardData = {
  id: string;
  name: string;
  agentId: string;
  model: string | null;
  tenantName: string;
  tenantSlug: string;
  status: EffectiveStatus;
  skillsCount: number;
  cronsCount: number;
  lastHeartbeatAt: Date | null;
  href: string;
  tenantHref: string;
  scope: "admin" | "client";
};

const statusTone: Record<EffectiveStatus, string> = {
  online: "from-emerald-500/22 via-emerald-400/8 to-cyan-400/18",
  stale: "from-amber-500/22 via-amber-400/8 to-orange-400/18",
  degraded: "from-orange-500/24 via-orange-400/8 to-rose-500/18",
  offline: "from-slate-500/16 via-slate-400/6 to-slate-300/8",
};

function MetricTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-200">
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function AgentCard({ a }: { a: AgentCardData }) {
  const heartbeatLabel = relativeTime(a.lastHeartbeatAt);

  return (
    <Link
      href={a.href}
      className="agent-card-premium group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#07111f] p-5 text-white shadow-[0_24px_80px_rgba(2,6,23,0.55)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${statusTone[a.status]} opacity-100`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.16),transparent_30%)]" />
      <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300">
        {a.scope === "admin" ? "admin" : "client"}
      </div>

      <div className="relative z-10 flex items-start gap-4">
        <AgentAvatar name={a.name} agentKey={a.agentId} />
        <div className="min-w-0 flex-1 pt-1">
          <div className="mb-2 flex items-center gap-2">
            <StatusPill status={a.status} scope={a.scope} />
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[11px] text-slate-300">
              <Radio className="h-3 w-3" />
              {heartbeatLabel}
            </span>
          </div>
          <h3 className="truncate text-xl font-semibold tracking-tight text-white">{a.name}</h3>
          <p className="mt-1 truncate font-mono text-xs text-cyan-200/80">{a.agentId}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              {a.tenantName}
            </span>
            {a.model ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-slate-200">
                <Cpu className="h-3.5 w-3.5 text-fuchsia-300" />
                {a.model}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-3 gap-3">
        <MetricTile icon={<Zap className="h-4 w-4 text-amber-300" />} label="skills" value={a.skillsCount} />
        <MetricTile icon={<Calendar className="h-4 w-4 text-cyan-300" />} label="crons" value={a.cronsCount} />
        <MetricTile icon={<Clock3 className="h-4 w-4 text-emerald-300" />} label="heartbeat" value={a.lastHeartbeatAt ? "ok" : "sem"} />
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Abrir cockpit</div>
          <div className="mt-1 text-sm font-medium text-white">Ver atividade, agenda e operação</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-2 text-cyan-300 transition group-hover:translate-x-1 group-hover:-translate-y-1">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

export function AgentCardGrid({ agents }: { agents: AgentCardData[] }) {
  if (agents.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
      {agents.map((a) => (
        <AgentCard key={a.id} a={a} />
      ))}
    </div>
  );
}

export type { AgentCardData };
