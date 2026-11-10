import type { Bot, TelegramChatMember } from "gramio";
import { config } from "../../config.ts";
import { TtlCache } from "../../lib/ttlCache.ts";

/** Anything that exposes the Bot API client, such as `context.bot`. */
export type BotApi = Pick<Bot, "api">;

const CACHE_TTL_MS = 5 * 60 * 1000;
const INVITE_LINK_TTL_S = 24 * 60 * 60;

const members = new TtlCache<TelegramChatMember | null>(CACHE_TTL_MS);

/** Statuses of a user who is currently inside the group. */
const PRESENT_STATUSES = new Set(["creator", "administrator", "member", "restricted"]);

export function isPresentInGroup(member: TelegramChatMember | null | undefined): boolean {
	if (!member || !PRESENT_STATUSES.has(member.status)) {
		return false;
	}
	// A restricted user can be outside the chat; Telegram reports this with is_member.
	return member.status !== "restricted" || member.is_member;
}

/**
 * Returns the membership of a user in the configured group, or `null` when
 * Telegram cannot resolve it (for example, the user never talked to the bot).
 */
export function getGroupMember(
	bot: BotApi,
	userId: number | bigint,
	fresh = false,
): Promise<TelegramChatMember | null> {
	const id = Number(userId);

	return members
		.getOrLoad(
			`${config.GROUP_ID}:${id}`,
			() => bot.api.getChatMember({ chat_id: config.GROUP_ID, user_id: id }),
			fresh,
		)
		.catch((error: unknown) => {
			console.error(`Telegram: cannot fetch chat member ${id}.`, error);
			return null;
		});
}

/** Forgets the cached membership of a user, for example after a ban. */
export function forgetGroupMember(userId: number | bigint): void {
	members.delete(`${config.GROUP_ID}:${Number(userId)}`);
}

/** Creates a single-use invite link for the group that expires after 24 hours. */
export async function createGroupInviteLink(bot: BotApi, name?: string): Promise<string> {
	const link = await bot.api.createChatInviteLink({
		chat_id: config.GROUP_ID,
		member_limit: 1,
		expire_date: Math.floor(Date.now() / 1000) + INVITE_LINK_TTL_S,
		...(name ? { name: name.slice(0, 32) } : {}),
	});
	return link.invite_link;
}
