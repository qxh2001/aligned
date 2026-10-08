import test from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { analysisQuota, quotaKey, reserveAnalysis } from "../server/ai-quota";
import { readFile } from "node:fs/promises";

test("anonymous requests are denied before accessing the quota store", async () => {
  const old = process.env.ALLOW_PUBLIC_AI_DEMO; delete process.env.ALLOW_PUBLIC_AI_DEMO;
  let status = 0;
  try {
    await analysisQuota({ connect: () => { throw new Error("must not access DB"); } } as any)(
      { isAuthenticated: () => false } as any,
      { status: (value: number) => { status = value; return { json: () => {} }; } } as any,
      () => assert.fail("must not reach the provider"),
    );
    assert.equal(status, 401);
  } finally { if (old !== undefined) process.env.ALLOW_PUBLIC_AI_DEMO = old; }
});
test("quota identities do not retain a raw IP and are keyed by the session secret", () => {
  const key = quotaKey("ip:192.0.2.1", "test-secret");
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.notEqual(key, quotaKey("ip:192.0.2.1", "other-secret"));
});
test("database outage fails closed", async () => {
  const previous = process.env.SESSION_SECRET; process.env.SESSION_SECRET = "offline-test";
  let status = 0;
  try {
    await analysisQuota({ connect: async () => { throw new Error("offline"); } } as any)(
      { isAuthenticated: () => true, user: { id: 1 } } as any,
      { status: (value: number) => { status = value; return { json: () => {} }; } } as any,
      () => assert.fail("must not reach the provider"),
    );
    assert.equal(status, 503);
  } finally { if (previous === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = previous; }
});
test("PostgreSQL enforces concurrent actor/global quotas and resets windows", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await pool.query("CREATE TABLE IF NOT EXISTS deadlines (id integer PRIMARY KEY)");
    await pool.query(await readFile(new URL("../migrations/ai_usage.sql", import.meta.url), "utf8"));
    await pool.query("TRUNCATE ai_usage");
    const now = Date.UTC(2026, 9, 8, 12);
    const results = await Promise.all(Array.from({ length: 12 }, () => reserveAnalysis(pool, "actor-a", { hourly: 3, daily: 5 }, now)));
    assert.equal(results.filter(Boolean).length, 3);
    // Failed actor reservations roll back the global counter.
    assert.equal((await pool.query("SELECT used FROM ai_usage WHERE key = 'global'")).rows[0].used, 3);
    assert.equal(await reserveAnalysis(pool, "actor-b", { hourly: 3, daily: 5 }, now), true);
    assert.equal(await reserveAnalysis(pool, "actor-b", { hourly: 3, daily: 5 }, now), true);
    assert.equal(await reserveAnalysis(pool, "actor-c", { hourly: 3, daily: 5 }, now), false);
    assert.equal(await reserveAnalysis(pool, "actor-a", { hourly: 3, daily: 5 }, now + 86_400_000), true);
  } finally { await pool.end(); }
});
