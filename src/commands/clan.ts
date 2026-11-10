import { bold, code, format } from "gramio";
import type { CommandCtx } from "../handlers/context.ts";
import { splitArgs } from "../lib/args.ts";
import { parseTag } from "../lib/tags.ts";
import { type Clan, cocApiService } from "../services/api/index.ts";
import type { Member } from "../services/users.ts";

const clanMessage = (clan: Clan) => format`${bold("Informazioni Clan")}

Nome: ${code(clan.name)}
Tag: ${code(clan.tag)}
Livello: ${code(clan.clanLevel)}
Descrizione:
${code(clan.description || "—")}

Membri: 👥 ${code(clan.memberList.length)}
Tipo: ${code(clan.type)}
Frequenza Guerra: ${code(clan.warFrequency ?? "—")}

Statistiche Guerra:
- Vittorie: ${code(clan.warWins)} ✅
- Serie Vittorie: ${code(clan.warWinStreak)} 🔥
- Sconfitte: ${code(clan.warLosses ?? "—")} ❌
- Pareggi: ${code(clan.warTies ?? "—")} 🔄

Coppe:
- Coppe del Clan: ${code(clan.clanPoints)} 🏆
- Coppe della Capitale: ${code(clan.clanCapitalPoints ?? "—")} 🏰`;

/** /clan [#TAG] — shows a clan. Without a tag, shows the clan of the caller. */
export async function clanCommand(context: CommandCtx, member: Member): Promise<void> {
	const [arg] = splitArgs(context.args);
	let tag: string | null | undefined;

	if (arg) {
		tag = parseTag(arg);
	} else {
		tag = (await cocApiService.getPlayer(member.clashProfile.tag))?.clan?.tag;
		if (!tag) {
			await context.reply("Non sei membro di nessun clan.");
			return;
		}
	}

	if (!tag) {
		await context.reply("Per favore, fornisci un tag di clan valido.");
		return;
	}

	const clan = await cocApiService.getClan(tag);
	if (!clan) {
		await context.reply("Non è stato possibile recuperare le informazioni del clan. Per favore, riprova più tardi.");
		return;
	}

	await context.reply(clanMessage(clan));
}
