import type { CommandCtx } from "../handlers/context.ts";
import { splitArgs } from "../lib/args.ts";
import { toDbRole } from "../lib/roles.ts";
import { parseTag } from "../lib/tags.ts";
import { cocApiService } from "../services/api/index.ts";
import { findUserByTelegramId, linkClashProfile } from "../services/users.ts";

const USAGE = "Utilizzo: /register #TAG <telegram_id>";

/**
 * /register #TAG <telegram_id> — registers a user manually, without the
 * API token check. Owner only.
 */
export async function registerCommand(context: CommandCtx): Promise<void> {
	const args = splitArgs(context.args);
	const tag = parseTag(args[0]);
	const telegramId = args[1] && /^\d+$/.test(args[1]) ? Number(args[1]) : null;

	if (args.length !== 2 || !tag || !telegramId || !Number.isSafeInteger(telegramId)) {
		await context.reply(USAGE);
		return;
	}

	const existing = await findUserByTelegramId(telegramId);
	if (existing?.clashProfile) {
		await context.reply(
			`${telegramId} è già registrato come ${existing.clashProfile.name} (${existing.clashProfile.tag}).`,
		);
		return;
	}

	const player = await cocApiService.getPlayer(tag, true);
	if (!player) {
		await context.reply(`${tag} non trovato.`);
		return;
	}

	if (!player.clan) {
		await context.reply(`${tag} non è membro di alcun clan.`);
		return;
	}

	const clan = await cocApiService.getClan(player.clan.tag);
	const role = clan?.memberList.find((m) => m.tag === tag)?.role;

	const result = await linkClashProfile({ id: telegramId }, { tag, name: player.name, role: toDbRole(role) });

	if (result === "tag_taken") {
		await context.reply(`${tag} è già registrato.`);
		return;
	}

	await context.reply(
		`Registrato con successo:\n\nTag: ${tag}\nNome: ${player.name}\nRuolo: ${role ?? "sconosciuto"}\nTelegram ID: ${telegramId}`,
	);
}
