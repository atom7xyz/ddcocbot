import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { config } from "../config.ts";
import * as schema from "./schema.ts";

/**
 * SQL client instance configured with the database URL from config
 */
export const sql = new SQL(config.DATABASE_URL);

/**
 * Drizzle ORM database client instance configured with:
 * - SQL client
 * - Snake case naming convention
 * - Database schema
 */
export const db = drizzle({
	client: sql,
	casing: "snake_case",
	schema: schema,
});

/**
 * Main function that seeds the database by clearing all tables
 */
const main = async () => {
	try {
		console.log("Seeding database...");

		// Clear all tables
		await db.delete(schema.telegramProfiles);
		await db.delete(schema.clashProfiles);
		await db.delete(schema.users);

		console.log("Database seeded successfully");
	} catch (error) {
		console.error(error);
	}
};

// Execute the main seeding function
main();

/**
 * Enum representing possible roles in the system
 */
export enum Role {
	LEADER = "leader",
	COLEADER = "coleader",
	ELDER = "elder",
	MEMBER = "member",
	NONE = "none",
}

/**
 * Converts a string role to the Role enum
 *
 * @param role - The role string to convert
 * @returns The corresponding Role enum value
 * @throws Error if the role is invalid
 */
export function roleToEnum(role: string | undefined): Role {
	if (!role) {
		return Role.NONE;
	}

	const lowerCaseRole = role.toLowerCase();
	const found = schema.roleEnum.enumValues.find(
		(value) => value === lowerCaseRole,
	);

	if (!found) {
		throw new Error(`Invalid role: ${role}`);
	}

	return found as Role;
}

/**
 * Converts a Role enum to its string representation
 *
 * @param role - The Role enum to convert
 * @returns The string representation of the role
 * @throws Error if the role is invalid
 */
export function enumToRole(role: Role | undefined): string {
	if (!role) {
		return Role.NONE;
	}

	const lowerCaseRole = role.toLowerCase();
	const found = schema.roleEnum.enumValues.find(
		(value) => value === lowerCaseRole,
	);

	if (!found) {
		throw new Error(`Invalid role: ${role}`);
	}

	return found;
}
