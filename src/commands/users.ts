import { db } from "db";
import type { clashProfiles, telegramProfiles, users } from "db/schema";
import type { Bot, MessageContext } from "gramio";
import { cocApiService, telegramApiService } from "services/api";
import { config } from "config";

interface NormalizedUser {
	telegramId: bigint;
	telegramUsername: string;
	telegramName: string;
	telegramLastName: string;
	clashName: string;
	clashTag: string;
	presentInGroup: boolean;
}

const listOfUsersMessage = (users: NormalizedUser[]) => `
Utenti Registrati:

${users
	.map(
		(user) =>
			`• ${user.clashName} - [${user.telegramUsername}](tg://user?id=${user.telegramId}) ${user.presentInGroup ? "" : "(non presente nel gruppo)"}`,
	)
	.join("\n")}
`;

const usersCommand = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	const player = await cocApiService.getPlayer(userClashProfile.tag);
	if (!player) {
		await context.reply(
			"Non è stato possibile recuperare le informazioni del giocatore.",
		);
		return;
	}

	const databaseUsers = await db.query.users.findMany({
		with: {
			clashProfile: true,
			telegramProfile: true,
		},
	});

	const normalizedListOfUsers: NormalizedUser[] = [];

	for (const user of databaseUsers) {
		if (!user.telegramProfile?.id || !user.clashProfile?.tag) {
			continue;
		}

		const groupMembers = await telegramApiService.getChatMember(
			Number(config.GROUP_ID),
			Number(user.telegramProfile.id),
		);

		const firstName = groupMembers?.user.first_name;
		const lastName = groupMembers?.user.last_name;
		const username =
			groupMembers?.user.username ?? firstName ?? lastName ?? "sconosciuto";

		normalizedListOfUsers.push({
			telegramId: user.telegramProfile.id,
			telegramUsername: username,
			telegramName: firstName ?? "????",
			telegramLastName: lastName ?? "????",
			clashName: user.clashProfile?.name ?? "????",
			clashTag: user.clashProfile?.tag ?? "????",
			presentInGroup:
				!!groupMembers &&
				["member", "administrator", "creator"].includes(groupMembers.status),
		});
	}

	await context.reply(
		`${listOfUsersMessage(normalizedListOfUsers)}\n(${normalizedListOfUsers.length} utenti totali registrati)`,
		{
			disable_notification: true,
			parse_mode: "Markdown",
		},
	);
};

export { usersCommand };
