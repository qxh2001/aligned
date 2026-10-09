import { createHmac } from "node:crypto";
import type { Pool } from "pg";
import type { RequestHandler } from "express";

function positiveLimit(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
export function quotaKey(identity: string, secret: string): string {
  return createHmac("sha256", secret).update(identity).digest("hex");
}
export async function reserveAnalysis(pool: Pool, actor: string, limits: { hourly: number; daily: number }, now = Date.now()): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Always lock the shared budget first to avoid actor/global lock-order deadlocks.
    for (const [key, window, limit] of [
      ["global", Math.floor(now / 86_400_000), limits.daily],
      [`actor:${actor}`, Math.floor(now / 3_600_000), limits.hourly],
    ] as const) {
      const result = await client.query(
        `INSERT INTO ai_usage (key, window_start, used) VALUES ($1, $2, 1)
         ON CONFLICT (key) DO UPDATE SET window_start = EXCLUDED.window_start,
           used = CASE WHEN ai_usage.window_start = EXCLUDED.window_start THEN ai_usage.used + 1 ELSE 1 END
         WHERE ai_usage.window_start <> EXCLUDED.window_start OR ai_usage.used < $3
         RETURNING used`, [key, window, limit],
      );
      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return false;
      }
    }
    // Expire old pseudonymous actor rows; never persist raw IP addresses or syllabus text.
    await client.query("DELETE FROM ai_usage WHERE key LIKE 'actor:%' AND window_start < $1", [Math.floor(now / 3_600_000) - 24]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function analysisQuota(pool: Pool): RequestHandler {
  return async (req, res, next) => {
    if (!req.isAuthenticated() && process.env.ALLOW_PUBLIC_AI_DEMO !== "true") {
      res.status(401).json({ success: false, error: "Sign in to analyze a syllabus." });
      return;
    }
    try {
      const secret = process.env.SESSION_SECRET;
      if (!secret) throw new Error("SESSION_SECRET is required for quota identities");
      const actor = quotaKey(req.user ? `user:${req.user.id}` : `ip:${req.ip || req.socket.remoteAddress || "unknown"}`, secret);
      const allowed = await reserveAnalysis(pool, actor, {
        hourly: positiveLimit(process.env.AI_HOURLY_LIMIT, 5),
        daily: positiveLimit(process.env.AI_DAILY_LIMIT, 100),
      });
      if (!allowed) {
        res.setHeader("Retry-After", "3600");
        res.status(429).json({ success: false, error: "Analysis limit reached. Please try again later." });
        return;
      }
      next();
    } catch (error) {
      console.error("AI quota unavailable:", error instanceof Error ? error.message : "unknown error");
      res.status(503).json({ success: false, error: "Analysis is temporarily unavailable. Please try again later." });
    }
  };
}
