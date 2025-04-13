import type { Bot, MessageContext } from "gramio";
import type { Clan } from "services/api";
import { cocApiService } from "services/api";
import type { clashProfiles, telegramProfiles, users } from "db/schema";

const clanMessage = (clan: Clan) => `
Nome: \`${clan.name}\`
Tag: \`${clan.tag}\`
Livello: \`${clan.clanLevel}\`
Descrizione: 
\`${clan.description}\`

Membri: 👥 \`${clan.memberList.length}\`
Tipo: \`${clan.type}\`
Frequenza Guerra: \`${clan.warFrequency}\`

Statistiche Guerra:
- Vittorie: \`${clan.warWins}\` ✅
- Serie Vittorie: \`${clan.warWinStreak}\` 🔥
- Sconfitte: \`${clan.warLosses}\` ❌
- Pareggi: \`${clan.warTies}\` 🔄

Coppe:
- Coppe del Clan: \`${clan.clanPoints}\` 🏆
- Coppe della Capitale: \`${clan.clanCapitalPoints}\` 🏰
`;

const clanCommand = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	const split = context.text?.split(" ");
	const argLength = split?.length ?? 0;

	if (split && argLength > 1) {
		await getInfoFromTag(context, split[1]);
		return;
	}

	const player = await cocApiService.getPlayer(userClashProfile.tag);

	if (!player || !player.clan) {
		await context.send("Non sei membro di nessun clan.");
		return;
	}

	await getInfoFromTag(context, player.clan.tag);
};

const getInfoFromTag = async (
	context: MessageContext<Bot>,
	tag: string | undefined,
) => {
	if (!tag) {
		await context.send("Per favore, fornisci un tag di clan valido.");
		return;
	}

	const clan = await cocApiService.getClan(tag);

	if (!clan) {
		await context.send(
			"Non è stato possibile recuperare le informazioni del clan. Per favore, riprova più tardi.",
		);
		return;
	}

	await context.reply(clanMessage(clan), {
		parse_mode: "Markdown",
	});
};

export { clanCommand };
