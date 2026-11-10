import { config } from "../config.ts";
import type { CommandCtx } from "../handlers/context.ts";
import { splitArgs } from "../lib/args.ts";
import { parseTag } from "../lib/tags.ts";
import { forgetGroupMember, getGroupMember } from "../services/api/index.ts";
import { findUserByTag } from "../services/users.ts";

/** /ban #TAG — removes the Telegram user linked to a tag from the group. */
export async function banCommand(context: CommandCtx): Promise<void> {
	const args = splitArgs(context.args);

	if (args.length !== 1) {
		await context.reply("Utilizzo: /ban #TAG");
		return;
	}

	const tag = parseTag(args[0]);
	if (!tag) {
		await context.reply(`${args[0]} non è un tag valido.`);
		return;
	}

	const target = await findUserByTag(tag);
	if (!target?.telegramProfile || !target.clashProfile) {
		await context.reply(`${tag} non trovato.`);
		return;
	}

	const telegramId = Number(target.telegramProfile.id);
	const chatMember = await getGroupMember(context.bot, telegramId, true);

	if (!chatMember) {
		await context.reply(`L'utente Telegram ${telegramId} non è stato trovato nel gruppo.`);
		return;
	}

	if (chatMember.status === "creator" || chatMember.status === "administrator") {
		await context.reply("Non puoi bannare un creatore o un amministratore!");
		return;
	}

	await context.bot.api.banChatMember({ chat_id: config.GROUP_ID, user_id: telegramId });
	forgetGroupMember(telegramId);

	await context.reply(
		`${target.telegramProfile.firstName || telegramId} (${target.clashProfile.name}) è stato rimosso dal gruppo.`,
	);
}
