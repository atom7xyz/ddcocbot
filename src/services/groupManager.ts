import type { Bot } from "gramio";
import { config } from "config";

/**
 * Generates a single-use invite link for the configured group chat
 *
 * This function:
 * 1. Uses the Telegram Bot API to create a chat invite link
 * 2. Sets the link to be single-use (member_limit: 1)
 * 3. Returns the generated invite link
 *
 * @param bot - The Telegram bot instance used to create the invite link
 * @returns Promise containing the generated invite link object
 */
export const generateInviteLink = async (bot: Bot) => {
	const link = await bot.api.createChatInviteLink({
		chat_id: config.GROUP_ID,
		member_limit: 1,
	});

	return link;
};
