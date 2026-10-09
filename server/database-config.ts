import { checkServerIdentity, type ConnectionOptions } from "node:tls";
import { X509Certificate } from "node:crypto";

export function databaseConnectionConfig(env: NodeJS.ProcessEnv = process.env): {
  connectionString: string; ssl?: ConnectionOptions;
} {
  // Explicit DATABASE_URL takes precedence during migration. If it is invalid,
  // fail instead of silently falling back to the retained source connection.
  if (!env.DATABASE_URL && env.SUPABASE_DATABASE_URL) {
    if (env.DATABASE_CA_CERT) throw new Error("DATABASE_CA_CERT requires an explicit DATABASE_URL.");
    return { connectionString: env.SUPABASE_DATABASE_URL, ssl: { rejectUnauthorized: false } };
  }
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required");
  let url: URL;
  try { url = new URL(env.DATABASE_URL); } catch { throw new Error("DATABASE_URL is invalid."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("DATABASE_URL must be a PostgreSQL URL.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const local = ["localhost", "127.0.0.1", "::1"].includes(host);
  if (local && !env.DATABASE_CA_CERT && !url.searchParams.has("sslmode")) {
    return { connectionString: env.DATABASE_URL };
  }
  // pg's URL parser can override an explicit ssl object. Validate and remove
  // URL TLS options so neither CA trust nor hostname verification is discarded.
  const mode = url.searchParams.get("sslmode");
  if (mode && mode !== "verify-full") throw new Error("Use sslmode=verify-full for this database connection.");
  for (const option of ["sslrootcert", "sslcert", "sslkey"]) {
    if (url.searchParams.has(option)) throw new Error("Use DATABASE_CA_CERT without TLS file parameters in DATABASE_URL.");
  }
  url.searchParams.delete("sslmode");
  const ca = env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
  if (ca) {
    try { new X509Certificate(ca); } catch { throw new Error("DATABASE_CA_CERT must contain a valid PEM certificate."); }
  }
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}),
      checkServerIdentity: (_servername, certificate) => checkServerIdentity(host, certificate),
    },
  };
}

export function databasePoolConfig(env: NodeJS.ProcessEnv = process.env) {
  const max = Number(env.DATABASE_POOL_MAX || 2);
  if (!Number.isSafeInteger(max) || max < 1 || max > 20) throw new Error("DATABASE_POOL_MAX must be between 1 and 20.");
  return { ...databaseConnectionConfig(env), max, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10_000 };
}
