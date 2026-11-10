import { bold, code, format } from "gramio";
import type { CommandCtx } from "../handlers/context.ts";
import { clashOfStatsKeyboard } from "../keyboards.ts";
import { parseTag } from "../lib/tags.ts";
import { cocApiService, type Player } from "../services/api/index.ts";
import { findClashProfileByName, type Member } from "../services/users.ts";

const playerMessage = (player: Player) => format`${bold("Informazioni Giocatore")}

Nome: ${code(player.name)}
Tag: ${code(player.tag)}
Municipio: ${code(player.townHallLevel)} 🏠
Livello: ${code(player.expLevel)} 🎖
Coppe: ${code(player.trophies)} 🏆 (Record: ${code(player.bestTrophies)})

Clan: ${code(player.clan?.name ?? "Nessuno")}`;

/**
 * /profile [#TAG | name] — shows a player.
 * Without an argument, shows the caller. A name is looked up among registered users.
 */
export async function profileCommand(context: CommandCtx, member: Member): Promise<void> {
	const query = context.args?.trim();
	let tag: string | null;

	if (!query) {
		tag = member.clashProfile.tag;
	} else if (query.startsWith("#")) {
		tag = parseTag(query);
	} else {
		tag = (await findClashProfileByName(query))?.tag ?? null;
	}

	if (!tag) {
		await context.reply("Per favore, fornisci un tag o il nome di un giocatore registrato.");
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
		reply_markup: clashOfStatsKeyboard(player.name, player.tag),
	});
}
