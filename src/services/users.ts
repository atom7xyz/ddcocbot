import { eq, sql } from "drizzle-orm";
import { config } from "../config.ts";
import { db } from "../db/index.ts";
import {
	type ClashProfile,
	clashProfiles,
	type TelegramProfile,
	telegramProfiles,
	type User,
	users,
} from "../db/schema.ts";
import { type DbRole, isClanAdminRole } from "../lib/roles.ts";
import { cocApiService } from "./api/index.ts";

/** A user with both a Telegram profile and a linked Clash of Clans profile. */
export interface Member {
	user: User;
	clashProfile: ClashProfile;
	telegramProfile: TelegramProfile;
}

/** The subset of a Telegram user that the database stores. */
export interface TelegramIdentity {
	id: number;
	username?: string | undefined;
	firstName?: string | undefined;
	lastName?: string | undefined;
}

export function findUserByTelegramId(telegramId: number | bigint) {
	return db.query.users.findFirst({
		where: eq(users.telegramProfileId, BigInt(telegramId)),
		with: { clashProfile: true, telegramProfile: true },
	});
}

export function findUserByTag(tag: string) {
	return db.query.users.findFirst({
		where: eq(users.clashProfileTag, tag),
		with: { clashProfile: true, telegramProfile: true },
	});
}

/** Returns the user only when the registration is complete. */
export async function findMember(telegramId: number | bigint): Promise<Member | undefined> {
	const user = await findUserByTelegramId(telegramId);
	if (!user?.clashProfile || !user.telegramProfile) {
		return undefined;
	}
	const { clashProfile, telegramProfile, ...row } = user;
	return { user: row, clashProfile, telegramProfile };
}

export function findClashProfile(tag: string) {
	return db.query.clashProfiles.findFirst({ where: eq(clashProfiles.tag, tag) });
}

export function findClashProfileByName(name: string) {
	return db.query.clashProfiles.findFirst({
		where: sql`lower(${clashProfiles.name}) = lower(${name})`,
	});
}

/**
 * Creates or refreshes the Telegram profile and makes sure a `users` row
 * exists for it. Safe to call more than once and from concurrent updates.
 */
export async function upsertTelegramUser(identity: TelegramIdentity): Promise<void> {
	const id = BigInt(identity.id);
	// Overwrite stored names only with the fields the caller knows.
	const names = Object.fromEntries(
		Object.entries({
			username: identity.username,
			firstName: identity.firstName,
			lastName: identity.lastName,
		}).filter(([, value]) => value !== undefined),
	) as Partial<Pick<TelegramProfile, "username" | "firstName" | "lastName">>;

	await db.transaction(async (tx) => {
		await tx
			.insert(telegramProfiles)
			.values({ id, ...names })
			.onConflictDoUpdate({
				target: telegramProfiles.id,
				set: { ...names, lastSeen: sql`now()` },
			});

		await tx.insert(users).values({ telegramProfileId: id }).onConflictDoNothing({
			target: users.telegramProfileId,
		});
	});
}

export type LinkResult = "linked" | "tag_taken";

/**
 * Links a Clash of Clans profile to a Telegram user in one transaction.
 *
 * @returns "tag_taken" when another user registered the same tag first.
 */
export async function linkClashProfile(
	identity: TelegramIdentity,
	profile: { tag: string; name: string; role: DbRole },
): Promise<LinkResult> {
	await upsertTelegramUser(identity);
	const telegramProfileId = BigInt(identity.id);

	return db.transaction(async (tx) => {
		const owner = await tx.query.users.findFirst({
			where: eq(users.clashProfileTag, profile.tag),
		});

		if (owner && owner.telegramProfileId !== telegramProfileId) {
			return "tag_taken";
		}

		await tx
			.insert(clashProfiles)
			.values(profile)
			.onConflictDoUpdate({
				target: clashProfiles.tag,
				set: { name: profile.name, role: profile.role },
			});

		await tx.update(users).set({ clashProfileTag: profile.tag }).where(eq(users.telegramProfileId, telegramProfileId));

		return "linked";
	});
}

/**
 * Deletes the Clash of Clans profile for a tag. The foreign key cascade
 * deletes the linked `users` row. The Telegram profile stays, so the person
 * can register again with /start.
 *
 * @returns The number of deleted Clash profiles (0 or 1).
 */
export async function deleteByTag(tag: string): Promise<number> {
	const deleted = await db
		.delete(clashProfiles)
		.where(eq(clashProfiles.tag, tag))
		.returning({ tag: clashProfiles.tag });
	return deleted.length;
}

/** True when the member is a leader or co-leader of the configured clan right now. */
export async function isClanAdmin(member: Member): Promise<boolean> {
	const clan = await cocApiService.getClan(config.COC_CLAN_TAG);
	const entry = clan?.memberList.find((m) => m.tag === member.clashProfile.tag);
	return isClanAdminRole(entry?.role);
}

export function isOwner(telegramId: number | bigint): boolean {
	return BigInt(telegramId) === BigInt(config.OWNER_TELEGRAM_ID);
}

export function listUsers() {
	return db.query.users.findMany({
		with: { clashProfile: true, telegramProfile: true },
		orderBy: users.id,
	});
}

export async function updateTelegramNames(identity: TelegramIdentity): Promise<void> {
	await db
		.update(telegramProfiles)
		.set({
			username: identity.username ?? "",
			firstName: identity.firstName ?? "",
			lastName: identity.lastName ?? "",
			lastSeen: sql`now()`,
		})
		.where(eq(telegramProfiles.id, BigInt(identity.id)));
}
