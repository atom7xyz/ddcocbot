import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "../config.ts";
import * as schema from "./schema.ts";

/**
 * Connection pool. `pg` is pure JavaScript, so it runs on Bun and on Node on
 * every platform, FreeBSD included.
 */
export const pool = new pg.Pool({
	connectionString: config.DATABASE_URL,
	max: 10,
});

pool.on("error", (error) => {
	console.error("Idle PostgreSQL client error:", error);
});

export const db = drizzle({
	client: pool,
	casing: "snake_case",
	schema,
});

export type Database = typeof db;
