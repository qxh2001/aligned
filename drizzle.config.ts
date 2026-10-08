import { defineConfig } from "drizzle-kit";
import { databaseConnectionConfig } from "./server/database-config";

const { connectionString: url, ssl } = databaseConnectionConfig();

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl,
  },
});
