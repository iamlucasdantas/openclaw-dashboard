import { randomBytes } from "node:crypto";

export const HEARTBEAT_FRESH_MS = 2 * 60 * 1000; // < 2 min = online
export const HEARTBEAT_STALE_MS = 10 * 60 * 1000; // 2-10 min = stale

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
  return (agent.status as EffectiveStatus) === "online" ? "offline" : "offline";
}

export function generateHeartbeatSecret() {
  return "ocs_" + randomBytes(24).toString("base64url");
}
