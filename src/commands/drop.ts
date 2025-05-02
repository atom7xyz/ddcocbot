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
	if (userTelegramProfile?.id !== BigInt(189384600)) {
		await context.reply("Non puoi usare questo comando.");
		return;
	}

	const split = context.text?.split(" ");
	const argsLength = split?.length ?? 0;

	if (!split || argsLength !== 2) {
		await context.reply("Utilizzo: /drop <tag> o <id>");
		return;
	}

	const tag = split[1];

	const foundUser = await db.query.users.findFirst({
		where: eq(users.id, Number(tag)),
	});

	await context.send(
		`Eliminando i dati di:\n- Tag: ${foundUser?.clashProfileTag}\n- ID: ${foundUser?.id}\n- Telegram ID: ${foundUser?.telegramProfileId}`,
	);

	if (tag) {
		await db.delete(users).where(eq(users.clashProfileTag, tag));
	} else {
		await db.delete(users).where(eq(users.id, Number(tag)));
	}

	await context.react("😈");
};
