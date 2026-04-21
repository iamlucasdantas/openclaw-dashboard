// openclaw-heartbeat.mjs — versão ESM (import)
// Use este arquivo se seu package.json tem "type": "module".
// Requer Node 18+ (fetch nativo).

const INTERVAL_MS = 60_000;

export function createHeartbeat({ dashboardUrl, agentId, secret, version = "1.0.0" }) {
  let timer = null;
  let lastStatus = "online";

  async function beat(status = lastStatus) {
    try {
      const res = await fetch(`${dashboardUrl}/api/agents/${agentId}/heartbeat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ version, status }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[openclaw] heartbeat ${res.status}: ${text}`);
      } else {
        lastStatus = status;
      }
    } catch (err) {
      console.warn(`[openclaw] heartbeat erro:`, err.message);
    }
  }

  function start() {
    beat("online");
    timer = setInterval(() => beat(), INTERVAL_MS);

    const shutdown = async () => {
      if (timer) clearInterval(timer);
      await beat("offline");
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  function setStatus(status) {
    lastStatus = status;
    return beat(status);
  }

  return { start, setStatus };
}
