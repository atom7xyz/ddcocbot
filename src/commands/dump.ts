import { bold, format, join, mention } from "gramio";
import type { CommandCtx } from "../handlers/context.ts";
import { listUsers } from "../services/users.ts";

/** /dump — lists every row of the users table, including incomplete registrations. Owner only. */
export async function dumpCommand(context: CommandCtx): Promise<void> {
	const rows = await listUsers();

	const lines = join(
		rows,
		({ clashProfile, telegramProfile }) => {
			const clash = clashProfile ? `${clashProfile.name} (${clashProfile.tag})` : "Non collegato";
			const label = telegramProfile?.username || telegramProfile?.firstName || String(telegramProfile?.id ?? "");
			const telegram = telegramProfile
				? mention(label, { id: Number(telegramProfile.id), is_bot: false, first_name: label })
				: "Non collegato";
			return format`• ${clash} - ${telegram}`;
		},
		"\n",
	);

	await context.reply(
		format`${bold("Tutti gli Utenti nel Database:")}

${lines}

(${rows.length} utenti totali nel database)`,
		{ disable_notification: true },
	);
}
