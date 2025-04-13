import type { MessageContext, Bot } from "gramio";
import { db } from "db";
import type { users, clashProfiles } from "db/schema";
import { telegramProfiles } from "db/schema";
import { eq } from "drizzle-orm";
import { telegramApiService } from "services/api";
import { config } from "config";

export const syncCommand = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	const allUsers = await db.query.users.findMany({
		with: {
			telegramProfile: true,
			clashProfile: true,
		},
	});

	let counter = 0;

	for (const user of allUsers) {
		const telegramProfile = user.telegramProfile;
		const clashProfile = user.clashProfile;

		if (!telegramProfile || !clashProfile) {
			continue;
		}

		const player = await telegramApiService.getChatMember(
			Number(config.GROUP_ID),
			Number(telegramProfile.id),
		);

		if (!player) {
			continue;
		}

		await db
			.update(telegramProfiles)
			.set({
				username: player.user.username ?? "",
				firstName: player.user.first_name ?? "",
				lastName: player.user.last_name ?? "",
				lastSeen: new Date(),
			})
			.where(eq(telegramProfiles.id, telegramProfile.id));

		++counter;
	}

	await context.reply(
		`Sincronizzati ${counter} utenti (${allUsers.length} utenti visti totali)`,
	);
};
