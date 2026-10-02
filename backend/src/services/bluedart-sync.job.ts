// bluedart-sync.job.ts
// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare Cron Trigger handler — polls Bluedart tracking for every active
// shipment every 5 minutes and writes scan events + order stage transitions.
//
// WHY THIS FILE EXISTS:
// The existing OrdersService.syncAllActiveShipmentsTracking() and
// POST /admin/shipments/sync-tracking handle on-demand syncing from the
// admin panel. This file wires the SAME logic into a Cloudflare Cron Trigger
// so syncing happens automatically without an admin action.
//
// WRANGLER WIRING (wrangler.jsonc):
//   "triggers": { "crons": ["* /5 * * * *"] }   (remove the space between * and /5 in actual config)
//
// WORKER WIRING (worker.ts):
//   The `scheduled` export below is re-exported from worker.ts default export
//   so Cloudflare picks it up from the single entry point.
//
// WHY NOT 30 SECONDS:
// Workers have no persistent process — setInterval doesn't survive requests.
// Cron Triggers bottom out at 1-minute granularity. Courier scan events land
// every few hours in practice (hub in-scan -> out-scan -> out-for-delivery ->
// delivered). 5-minute polling gives near-real-time UX without hammering
// Bluedart's rate limits. If sub-minute granularity is ever needed for
// "Out for Delivery" days specifically, use a Durable Object Alarm scoped to
// that shipment on that day — don't build a global 30s loop.
//
// DB ACCESS:
// Uses the Supabase client from config/db.ts (already Worker-compatible,
// no raw TCP sockets needed). The sync logic lives in OrdersService to keep
// a single source of truth — this file is purely the scheduler entry point.
// ─────────────────────────────────────────────────────────────────────────────


import { OrdersService } from "./orders.service.js";
import { isBlueDartConfigured } from "./bluedart.service.js";

// Propagate Cloudflare Worker env bindings to process.env so the existing
// env.ts / Supabase / BlueDart config chain continues to work unchanged.
function applyWorkerEnv(workerEnv: Record<string, unknown>): void {
  if (workerEnv && typeof workerEnv === "object") {
    for (const [key, value] of Object.entries(workerEnv)) {
      if (typeof value === "string") {
        process.env[key] = value;
      }
    }
  }
}

/**
 * Runs a full tracking sync pass for all active shipments.
 * Returns a summary of how many shipments were checked and synced.
 *
 * Also callable directly for testing without the cron:
 *   import { runBlueDartSyncPass } from './bluedart-sync.job.js';
 *   await runBlueDartSyncPass();
 */
export async function runBlueDartSyncPass(): Promise<{
  checked: number;
  synced: number;
  skipped: boolean;
}> {
  if (!isBlueDartConfigured()) {
    console.warn("[bluedart-sync] BlueDart not configured — skipping sync pass.");
    return { checked: 0, synced: 0, skipped: true };
  }

  const result = await OrdersService.syncAllActiveShipmentsTracking();
  return {
    checked: result.totalProcessed,
    synced: result.syncedCount,
    skipped: false,
  };
}

// Cloudflare Worker `scheduled` export handler.
// Re-exported from worker.ts default export as:
//   export default { fetch: ..., scheduled: blueDartScheduled }
// Triggered by the cron expression in wrangler.jsonc (every 5 minutes).
export async function blueDartScheduled(
  _event: unknown,
  workerEnv: Record<string, unknown>,
  ctx: { waitUntil(promise: Promise<unknown>): void }
): Promise<void> {
  applyWorkerEnv(workerEnv);
  ctx.waitUntil(
    runBlueDartSyncPass()
      .then((r) => {
        if (r.skipped) {
          console.log("[bluedart-sync] Skipped (not configured).");
        } else {
          console.log(
            `[bluedart-sync] Pass complete — checked=${r.checked} synced=${r.synced}`
          );
        }
      })
      .catch((err) => {
        console.error("[bluedart-sync] Unhandled error during cron pass:", err);
      })
  );
}
