import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { databasePoolConfig } from "./database-config";

export const pool = new Pool(databasePoolConfig());
export const db = drizzle(pool, { schema });
