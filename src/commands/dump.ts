import { db } from "db";
import type { clashProfiles, telegramProfiles, users } from "db/schema";
import type { Bot, MessageContext } from "gramio";

interface DatabaseUser {
	userId: number;
	telegramId: bigint | null;
	telegramUsername: string | null;
	telegramName: string | null;
	telegramLastName: string | null;
	clashName: string | null;
	clashTag: string | null;
}

const databaseDumpMessage = (users: DatabaseUser[]) => `
Tutti gli Utenti nel Database:
${users
	.map((user) => {
		const clashInfo =
			user.clashName && user.clashTag
				? `${user.clashName} (${user.clashTag})`
				: "Non collegato";
		const telegramInfo =
			user.telegramId && user.telegramUsername
				? `[${user.telegramUsername}](tg://user?id=${user.telegramId})`
				: "Non collegato";
		return `• ${clashInfo} - ${telegramInfo}`;
	})
	.join("\n")}
`;

const dumpCommand = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	try {
		const databaseUsers = await db.query.users.findMany({
			with: {
				clashProfile: true,
				telegramProfile: true,
			},
		});

		const normalizedUsers: DatabaseUser[] = databaseUsers.map((user) => ({
			userId: user.id,
			telegramId: user.telegramProfile?.id || null,
			telegramUsername: user.telegramProfile?.username || null,
			telegramName: user.telegramProfile?.firstName || null,
			telegramLastName: user.telegramProfile?.lastName || null,
			clashName: user.clashProfile?.name || null,
			clashTag: user.clashProfile?.tag || null,
		}));

		// Sort by user ID for consistent ordering
		normalizedUsers.sort((a, b) => a.userId - b.userId);

		await context.reply(
			`${databaseDumpMessage(normalizedUsers)}\n(${normalizedUsers.length} utenti totali nel database)`,
			{
				disable_notification: true,
				parse_mode: "Markdown",
			},
		);
	} catch (error) {
		console.error("Error in dump command:", error);
		await context.reply(
			"Non è stato possibile recuperare i dati dal database.",
		);
	}
};

export { dumpCommand };
