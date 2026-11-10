import type { CommandCtx } from "../handlers/context.ts";
import { splitArgs } from "../lib/args.ts";
import { parseTag } from "../lib/tags.ts";
import { deleteByTag } from "../services/users.ts";

/**
 * /drop #TAG — deletes the registration for a tag. Owner only.
 * The Telegram profile stays, so the person can register again.
 */
export async function dropCommand(context: CommandCtx): Promise<void> {
	const args = splitArgs(context.args);
	const tag = args.length === 1 ? parseTag(args[0]) : null;

	if (!tag) {
		await context.reply("Utilizzo: /drop #TAG");
		return;
	}

	const deleted = await deleteByTag(tag);
	console.log(`Owner ${context.from.id} dropped ${tag} (deleted: ${deleted}).`);

	if (deleted === 0) {
		await context.reply(`${tag} non trovato.`);
		return;
	}

	await context.reply(`Dati di ${tag} eliminati.`);
	await context.react("😈");
}
