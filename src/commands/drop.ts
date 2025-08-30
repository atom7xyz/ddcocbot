import { db } from "db";
import { type clashProfiles, type telegramProfiles, users } from "db/schema";
import type { Bot, MessageContext } from "gramio";
import { eq } from "drizzle-orm";

export const dropCommand = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	const split = context.text?.split(" ");
	const argsLength = split?.length ?? 0;

	if (!split || argsLength !== 2) {
		await context.reply("Utilizzo: /drop <tag>");
		return;
	}

	const tag = split[1];

	if (!tag) {
		await context.reply("Tag non valida!");
		return;
	}

	await context.send(`Eliminando i dati di ${tag}...`);
	console.log(`Eliminando i dati di ${tag}...`);

	await db.delete(users).where(eq(users.clashProfileTag, tag));

	await context.react("😈");
};
