import type { Bot, MessageContext } from "gramio";
import { cocApiService } from "services/api";
import type { Player } from "services/api/models/cocModels";
import { clashProfiles, type telegramProfiles, type users } from "db/schema";
import { suggestClashOfStatsKeyboard } from "shared/keyboards";
import { db } from "db";
import { eq } from "drizzle-orm";

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
	const tag = split != null ? split[1] : userClashProfile.tag;

	if (tag?.startsWith("#")) {
		await getInfoFromTag(context, tag);
		return;
	}

	await getInfoFromName(context, tag);
};

const getInfoFromName = async (
	context: MessageContext<Bot>,
	name: string | undefined,
) => {
	if (!name) {
		await context.reply("Per favore, fornisci un nome giocatore valido.");
		return;
	}

	const clashProfile = await db.query.clashProfiles.findFirst({
		where: eq(clashProfiles.name, name),
	});

	if (!clashProfile) {
		await context.reply("Per favore, fornisci un nome giocatore valido.");
		return;
	}

	const player = await cocApiService.getPlayer(clashProfile.tag);
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

const getInfoFromTag = async (
	context: MessageContext<Bot>,
	tag: string | undefined,
) => {
	if (!tag) {
		await context.reply("Per favore, fornisci un tag giocatore valido.");
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
