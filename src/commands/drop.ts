import { db } from "db";
import { clashProfiles, telegramProfiles, users } from "db/schema";
import type { Bot, MessageContext } from "gramio";
import { getTelegramUserId } from "utils";

const dropCommand = async (context: MessageContext<Bot>) => {
	const telegramUserId = getTelegramUserId(context);

	if (telegramUserId !== BigInt(189384600)) {
		await context.reply("Non sei autorizzato a usare questo comando.");
		return;
	}

	await db.delete(users);
	await db.delete(telegramProfiles);
	await db.delete(clashProfiles);

	await context.react("😈");
};

export { dropCommand };
