import { db } from "db";
import {
	type users,
	type clashProfiles,
	type telegramProfiles,
	polls,
	pollVotes,
} from "db/schema";
import type { Bot, MessageContext } from "gramio";
import { eq } from "drizzle-orm";
import { bot } from "bot";

export const getPoll = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	if (!context.text) {
		await context.reply("Utilizzo: /getpoll");
		return;
	}
};
