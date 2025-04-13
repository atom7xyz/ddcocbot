import { config } from "config";
import { db } from "db";
import type { clashProfiles, telegramProfiles } from "db/schema";
import { users } from "db/schema";
import { eq } from "drizzle-orm";
import type { Bot, MessageContext } from "gramio";
import { telegramApiService } from "services/api";

export const banCommand = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	const split = context.text?.split(" ");
	const argsLength = split?.length ?? 0;

	if (!split || argsLength < 2) {
		await context.reply("Utilizzo: /ban <tag>");
		return;
	}

	const tag = split[1];

	if (!tag) {
		await context.reply(`${tag} non valido`);
		return;
	}

	const target = await db.query.users.findFirst({
		where: eq(users.clashProfileTag, tag),
		with: {
			clashProfile: true,
			telegramProfile: true,
		},
	});

	if (!target || !target.telegramProfile || !target.clashProfile) {
		await context.reply(`${tag} non trovato`);
		return;
	}

	const chatMember = await telegramApiService.getChatMember(
		Number(config.GROUP_ID),
		Number(userTelegramProfile.id),
	);

	if (!chatMember) {
		await context.reply(`${userTelegramProfile.id} non trovato`);
		return;
	}

	if (["creator", "administrator"].includes(chatMember.status)) {
		await context.reply("Non puoi bannare un creatore o un amministratore!");
		return;
	}

	await context.banMember({
		chat_id: Number(config.GROUP_ID),
		user_id: Number(target.telegramProfile.id),
	});

	await context.reply(
		`${target.telegramProfile.firstName} (${target.clashProfile.name}) è stato bannato dal gruppo.`,
	);
};
