import { relations } from "drizzle-orm";
import { bigint, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { DB_ROLES } from "../lib/roles.ts";

export const roleEnum = pgEnum("role", DB_ROLES);

export const telegramProfiles = pgTable("telegram_profiles", {
	id: bigint("id", { mode: "bigint" }).primaryKey(),
	username: varchar("username", { length: 255 }).default(""),
	firstName: varchar("first_name", { length: 255 }).default(""),
	lastName: varchar("last_name", { length: 255 }).default(""),
	firstSeen: timestamp("first_seen").notNull().defaultNow(),
	lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export const clashProfiles = pgTable("clash_profiles", {
	tag: varchar("tag", { length: 16 }).primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	role: roleEnum(),
});

export const users = pgTable("users", {
	id: serial("id").primaryKey(),

	telegramProfileId: bigint("telegram_profile_id", { mode: "bigint" })
		.unique()
		.references(() => telegramProfiles.id, { onDelete: "cascade" }),

	clashProfileTag: varchar("clash_profile_tag")
		.unique()
		.references(() => clashProfiles.tag, {
			onDelete: "cascade",
		}),
});

export const usersRelations = relations(users, ({ one }) => ({
	telegramProfile: one(telegramProfiles, {
		fields: [users.telegramProfileId],
		references: [telegramProfiles.id],
	}),
	clashProfile: one(clashProfiles, {
		fields: [users.clashProfileTag],
		references: [clashProfiles.tag],
	}),
}));

export type User = typeof users.$inferSelect;
export type TelegramProfile = typeof telegramProfiles.$inferSelect;
export type ClashProfile = typeof clashProfiles.$inferSelect;
