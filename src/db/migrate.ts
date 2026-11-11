/**
 * Applies the SQL migrations in ./drizzle with the runtime ORM only, so
 * production hosts do not need drizzle-kit (a dev dependency).
 */
import "../logging.ts";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.ts";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

try {
	await migrate(db, { migrationsFolder });
	console.log("Migrations applied.");
} finally {
	await pool.end();
}
