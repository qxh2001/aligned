import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { PeerCertificate } from "node:tls";
import { Client } from "pg";
import { databaseConnectionConfig, databasePoolConfig } from "../server/database-config";

const ca = readFileSync(new URL("./fixtures/database-ca.pem", import.meta.url), "utf8");
test("remote TLS keeps CA and identity verification after pg parses the URL", () => {
  const config = databaseConnectionConfig({
    DATABASE_URL: "postgresql://example:offline@192.0.2.1/aligned?sslmode=verify-full",
    DATABASE_CA_CERT: ca,
  });
  const client = new Client(config);
  const ssl = (client as any).connectionParameters.ssl;
  assert.equal(ssl.ca, ca);
  assert.equal(ssl.rejectUnauthorized, true);
  assert.equal(new URL(config.connectionString).searchParams.has("sslmode"), false);
  const match = { subjectaltname: "IP Address:192.0.2.1", subject: { CN: "fixture" } } as PeerCertificate;
  const mismatch = { subjectaltname: "IP Address:192.0.2.2", subject: { CN: "fixture" } } as PeerCertificate;
  assert.equal(ssl.checkServerIdentity("ignored", match), undefined);
  assert.equal(ssl.checkServerIdentity("ignored", mismatch).code, "ERR_TLS_CERT_ALTNAME_INVALID");
});
test("insecure remote TLS modes and conflicting CA sources fail before connecting", () => {
  for (const suffix of ["sslmode=disable", "sslmode=no-verify", "sslmode=require", "sslrootcert=/unused/file", "sslkey=/unused/key"]) {
    assert.throws(() => databaseConnectionConfig({ DATABASE_URL: `postgresql://example:offline@db.example.test/aligned?${suffix}` }));
  }
  assert.throws(() => databaseConnectionConfig({ SUPABASE_DATABASE_URL: "postgresql://example:offline@db.example.test/postgres", DATABASE_CA_CERT: ca }));
  assert.throws(() => databaseConnectionConfig({ DATABASE_URL: "postgresql://example:offline@db.example.test/aligned", DATABASE_CA_CERT: "invalid" }));
});
test("local development can use plain PostgreSQL; pool budgets are bounded", () => {
  const env = { DATABASE_URL: "postgresql://example:offline@localhost/aligned" };
  assert.equal(databaseConnectionConfig(env).ssl, undefined);
  assert.equal(databasePoolConfig(env).max, 2);
  for (const value of ["0", "21", "invalid", "1.5"]) assert.throws(() => databasePoolConfig({ ...env, DATABASE_POOL_MAX: value }));
  assert.equal(databaseConnectionConfig({ DATABASE_URL: "postgresql://example:offline@db.example.test/aligned" }).ssl?.rejectUnauthorized, true);
});
