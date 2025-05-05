import { relations } from "drizzle-orm";
import {
	pgTable,
	serial,
	varchar,
	timestamp,
	bigint,
	char,
	pgEnum,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: serial("id").primaryKey(),

	telegramProfileId: bigint("telegram_profile_id", {
		mode: "bigint",
	}).references(() => telegramProfiles.id, { onDelete: "cascade" }),

	clashProfileTag: varchar("clash_profile_tag").references(
		() => clashProfiles.tag,
		{ onDelete: "cascade" },
	),
});

export const telegramProfiles = pgTable("telegram_profiles", {
	id: bigint("id", { mode: "bigint" }).primaryKey(),
	username: varchar("username", { length: 255 }).default(""),
	firstName: varchar("first_name", { length: 255 }).default(""),
	lastName: varchar("last_name", { length: 255 }).default(""),
	firstSeen: timestamp("first_seen").notNull().defaultNow(),
	lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export const roleEnum = pgEnum("role", [
	"leader",
	"coleader",
	"elder",
	"member",
	"none",
]);

export const clashProfiles = pgTable("clash_profiles", {
	tag: char("tag", { length: 10 }).primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	role: roleEnum(),
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

export const schema = {
	telegramProfiles,
	users,
	clashProfiles,
	roleEnum,
};
