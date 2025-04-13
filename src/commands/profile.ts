import type { Bot, MessageContext } from "gramio";
import { cocApiService } from "services/api";
import type { Player } from "services/api/models/cocModels";
import type { clashProfiles, telegramProfiles, users } from "db/schema";
import { suggestClashOfStatsKeyboard } from "shared/keyboards";

const playerMessage = (player: Player) => `
Informazioni Giocatore

Nome: \`${player.name}\`
Tag: \`${player.tag}\`
Municipio: \`${player.townHallLevel}\` 🏠
Livello: \`${player.expLevel}\` 🎖
Coppe: \`${player.trophies}\` 🏆 (Record: \`${player.bestTrophies}\`)

Clan: \`${player.clan?.name ?? "Nessuno"}\`
`;

const playerCommand = async (
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

	await getInfoFromTag(context, userClashProfile.tag);
};

const getInfoFromTag = async (
	context: MessageContext<Bot>,
	tag: string | undefined,
) => {
	if (!tag) {
		await context.reply("Per favore, fornisci un tag di giocatore valido.");
		return;
	}

	const player = await cocApiService.getPlayer(tag);

	if (!player) {
		await context.reply(
			"Non è stato possibile recuperare le informazioni del giocatore. Per favore, riprova più tardi.",
		);
		return;
	}

	await context.reply(playerMessage(player), {
		parse_mode: "Markdown",
		reply_markup: {
			inline_keyboard: suggestClashOfStatsKeyboard(player.name, player.tag),
		},
	});
};

export { playerCommand };
