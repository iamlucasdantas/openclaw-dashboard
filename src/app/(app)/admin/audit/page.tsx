import { History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/form";
import { EmptyState } from "@/components/empty-state";

const ACTION_LABELS: Record<string, string> = {
  "tenant.create": "Criou cliente",
  "tenant.update": "Editou cliente",
  "tenant.delete": "Excluiu cliente",
  "agent.create": "Criou agente",
  "agent.update": "Editou agente",
  "agent.delete": "Excluiu agente",
  "user.create": "Criou usuário",
  "user.update": "Editou usuário",
  "user.delete": "Excluiu usuário",
  "user.password_reset": "Redefiniu senha de usuário",
  "membership.add": "Vinculou usuário a cliente",
  "membership.remove": "Removeu vínculo de cliente",
  "invite.create": "Emitiu convite",
  "invite.revoke": "Revogou convite",
  "invite.accept": "Convite aceito",
  "profile.update": "Atualizou próprio perfil",
  "profile.password_change": "Trocou a própria senha",
};

const CATEGORY_COLORS: Record<string, string> = {
  tenant: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  agent: "bg-violet-500/15 text-violet-300 border border-violet-500/20",
  user: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  membership: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20",
  invite: "bg-pink-500/15 text-pink-300 border border-pink-500/20",
  profile: "bg-secondary text-muted-foreground border border-border",
};

export default async function AuditPage() {
  const events = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Últimos 200 eventos registrados no painel."
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 text-left">Quando</th>
              <th className="px-5 py-2.5 text-left">Quem</th>
              <th className="px-5 py-2.5 text-left">Ação</th>
              <th className="px-5 py-2.5 text-left">Entidade</th>
              <th className="px-5 py-2.5 text-left">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const category = e.action.split(".")[0];
              return (
                <tr key={e.id} className="border-t align-top">
                  <td className="whitespace-nowrap px-5 py-2.5 text-muted-foreground">
                    {formatDate(e.createdAt)}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="font-medium">
                      {e.actorName ?? "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {e.actorEmail ?? "(sistema)"}
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        CATEGORY_COLORS[category] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-xs text-muted-foreground">
                    <div>{e.entityType}</div>
                    {e.entityId ? (
                      <code className="text-[10px]">{e.entityId}</code>
                    ) : null}
                  </td>
                  <td className="px-5 py-2.5 text-xs text-muted-foreground">
                    <MetaSummary raw={e.meta} />
                  </td>
                </tr>
              );
            })}
            {events.length === 0 && (
              <EmptyState
                colSpan={5}
                icon={<History className="h-5 w-5" />}
                title="Nenhum evento ainda"
                description="A auditoria registra toda mutação feita no painel (criar/editar/excluir). Assim que alguém fizer uma mudança, ela aparece aqui."
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetaSummary({ raw }: { raw: string | null }) {
  if (!raw) return <span>—</span>;
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return <span className="break-all">{raw}</span>;
  }

  const summary = summarize(parsed);
  return (
    <details>
      <summary className="cursor-pointer select-none hover:text-foreground">
        {summary}
      </summary>
      <pre className="mt-2 max-w-md overflow-x-auto rounded bg-muted p-2 text-[11px] text-foreground">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </details>
  );
}

function summarize(obj: any): string {
  if (!obj || typeof obj !== "object") return String(obj);
  const keys = Object.keys(obj);
  const hasDiff = keys.includes("before") && keys.includes("after");
  if (hasDiff) {
    const changed: string[] = [];
    const before = obj.before ?? {};
    const after = obj.after ?? {};
    for (const k of Object.keys(after)) {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
        changed.push(k);
      }
    }
    return `alterou: ${changed.join(", ") || "(sem mudanças)"}`;
  }
  const preferred = ["name", "email", "agentId", "slug", "tenantId"];
  for (const k of preferred) {
    if (obj[k]) return `${k}=${obj[k]}`;
  }
  return keys.slice(0, 3).join(", ");
}
