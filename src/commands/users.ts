import { bold, format, join, mention } from "gramio";
import type { CommandCtx } from "../handlers/context.ts";
import { splitArgs } from "../lib/args.ts";
import { getGroupMember, isPresentInGroup } from "../services/api/index.ts";
import { listUsers } from "../services/users.ts";

/**
 * /users [all] — lists registered users who are in the group.
 * With "all", also lists registered users who left the group.
 */
export async function usersCommand(context: CommandCtx): Promise<void> {
	const allMode = splitArgs(context.args)[0]?.toLowerCase() === "all";
	const registered = (await listUsers()).filter((u) => u.telegramProfile && u.clashProfile);

	const rows = await Promise.all(
		registered.map(async (user) => {
			// biome-ignore lint/style/noNonNullAssertion: filtered above
			const telegram = user.telegramProfile!;
			// biome-ignore lint/style/noNonNullAssertion: filtered above
			const clash = user.clashProfile!;
			const groupMember = await getGroupMember(context.bot, telegram.id);
			const present = isPresentInGroup(groupMember);
			const tgUser = groupMember?.user;
			const label =
				tgUser?.username ?? tgUser?.first_name ?? (telegram.username || telegram.firstName || "sconosciuto");

			return { present, clashName: clash.name, telegramId: Number(telegram.id), label };
		}),
	);

	const shown = rows.filter((row) => allMode || row.present);

	const lines = join(
		shown,
		(row) =>
			format`• ${row.clashName} - ${mention(row.label, { id: row.telegramId, is_bot: false, first_name: row.label })}${row.present ? "" : " (fuori dal gruppo)"}`,
		"\n",
	);

	await context.reply(
		format`${bold("Utenti Registrati:")}

${lines}

(${shown.length} utenti mostrati, ${registered.length} registrati)`,
		{ disable_notification: true },
	);
}
