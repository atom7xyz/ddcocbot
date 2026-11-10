import type { Config } from "drizzle-kit";

export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		// Only `push`, `pull` and `studio` connect; `generate` works without a database.
		url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/ddcocbot",
	},
} satisfies Config;
