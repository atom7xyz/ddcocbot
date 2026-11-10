import { bold, format, join } from "gramio";
import type { CommandCtx } from "../handlers/context.ts";
import { splitArgs } from "../lib/args.ts";
import { roleLabel, roleRank } from "../lib/roles.ts";
import { parseTag } from "../lib/tags.ts";
import { type ClanMember, cocApiService } from "../services/api/index.ts";
import type { Member } from "../services/users.ts";

/** Leaders first, then by in-game clan rank. Returns a new array. */
const sortMembers = (members: readonly ClanMember[]) =>
	members.toSorted((a, b) => roleRank(a.role) - roleRank(b.role) || a.clanRank - b.clanRank);

/** /members [#TAG] — lists the members of a clan, by role. */
export async function membersCommand(context: CommandCtx, member: Member): Promise<void> {
	const [arg] = splitArgs(context.args);
	let tag: string | null | undefined;

	if (arg) {
		tag = parseTag(arg);
	} else {
		const player = await cocApiService.getPlayer(member.clashProfile.tag);
		if (!player) {
			await context.reply("Non è stato possibile recuperare le informazioni del tuo clan.");
			return;
		}
		tag = player.clan?.tag;
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
		await context.reply("Non è stato possibile recuperare le informazioni del clan.");
		return;
	}

	const lines = join(sortMembers(clan.memberList), (m) => format`${roleLabel(m.role)} — ${m.name} (${m.tag})`, "\n");

	await context.reply(
		format`${bold(`Membri del clan ${clan.name} (${clan.tag})`)}

${lines}

(${clan.memberList.length} membri totali)`,
	);
}
