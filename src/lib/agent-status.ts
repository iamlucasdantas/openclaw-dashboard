import { randomBytes } from "node:crypto";

export const HEARTBEAT_FRESH_MS = 2 * 60 * 1000; // < 2 min = online
export const HEARTBEAT_STALE_MS = 10 * 60 * 1000; // 2-10 min = stale

// Status "efetivo" técnico — camada interna / admin.
export type EffectiveStatus = "online" | "stale" | "offline" | "degraded";

export function effectiveStatus(agent: {
  status: string;
  lastHeartbeatAt: Date | null;
}): EffectiveStatus {
  if (agent.status === "degraded") return "degraded";

  if (agent.lastHeartbeatAt) {
    const age = Date.now() - agent.lastHeartbeatAt.getTime();
    if (age < HEARTBEAT_FRESH_MS) return "online";
    if (age < HEARTBEAT_STALE_MS) return "stale";
    return "offline";
  }
  // sem heartbeat algum registrado
  return "offline";
}

// Chave semântica usada no copy.ts — camada cliente.
export type HumanStatusKey = "working" | "quiet" | "attention" | "stopped";

export function humanStatusKey(status: EffectiveStatus): HumanStatusKey {
  switch (status) {
    case "online":
      return "working";
    case "stale":
      return "quiet";
    case "degraded":
      return "attention";
    case "offline":
      return "stopped";
  }
}

export function generateHeartbeatSecret() {
  return "ocs_" + randomBytes(24).toString("base64url");
}
