import { config } from "config";
import { db } from "db";
import { clashProfiles, users } from "db/schema";
import { eq } from "drizzle-orm";
import type { Bot, MessageContext, User } from "gramio";
import { cocApiService } from "services/api";

/**
 * Checks if the message is in a private chat
 *
 * @param context - The message context
 * @returns True if the message is in a private chat, false otherwise
 */
function checkPrivateChat(context: MessageContext<Bot>) {
	return context.chat.type === "private";
}

/**
 * Checks if a user exists in the database
 *
 * @param tag - The Clash of Clans tag
 * @returns The Clash of Clans profile if found, otherwise undefined
 */
async function checkClashProfileExists(tag: string) {
	const clashProfile = await db.query.clashProfiles.findFirst({
		where: eq(clashProfiles.tag, tag),
	});

	return clashProfile;
}

/**
 * Checks if a user is registered in the database
 *
 * @param context - The message context
 * @returns The user if found, otherwise undefined
 */
async function checkUserIsRegistered(context: MessageContext<Bot>) {
	const telegramUserId = getTelegramUserId(context);

	const user = await db.query.users.findFirst({
		where: eq(users.telegramProfileId, telegramUserId),
		with: {
			clashProfile: true,
			telegramProfile: true,
		},
	});

	return user;
}

/**
 * Checks if a user is an admin of the clan
 *
 * @param context - The message context
 * @returns True if the user is an admin of the clan, false otherwise
 */
async function checkUserIsAdmin(context: MessageContext<Bot>) {
	const telegramUserId = getTelegramUserId(context);

	const user = await db.query.users.findFirst({
		where: eq(users.telegramProfileId, telegramUserId),
	});

	if (!user) {
		return false;
	}

	const clan = await cocApiService.getClan(config.COC_CLAN_TAG);

	if (!clan) {
		return false;
	}

	const adminRoles = ["leader", "coLeader"];

	const isAdmin = clan.memberList.some(
		(member) =>
			adminRoles.includes(member.role) && member.tag === user.clashProfileTag,
	);

	console.log(clan.memberList.map((member) => `${member.role} ${member.tag}`));

	return isAdmin;
}

async function checkUserIsOwner(context: MessageContext<Bot>) {
	return getTelegramUserId(context) === BigInt(189384600);
}

/**
 * Gets the Telegram user from the message context
 *
 * @param context - The message context
 * @returns The Telegram user
 */
function getTelegramUser(context: MessageContext<Bot>): User {
	// biome-ignore lint/style/noNonNullAssertion: cannot be null
	return context.from!;
}

/**
 * Gets the Telegram user ID from the message context
 *
 * @param context - The message context
 * @returns The Telegram user ID
 */
function getTelegramUserId(context: MessageContext<Bot>): bigint {
	return BigInt(getTelegramUser(context).id);
}

export {
	checkPrivateChat,
	checkClashProfileExists,
	checkUserIsAdmin,
	checkUserIsRegistered,
	getTelegramUser,
	getTelegramUserId,
	checkUserIsOwner,
};
