import type { CommandCtx } from "../handlers/context.ts";
import { getGroupMember } from "../services/api/index.ts";
import { listUsers, updateTelegramNames } from "../services/users.ts";

/** /sync — refreshes stored Telegram names from the group membership. */
export async function syncCommand(context: CommandCtx): Promise<void> {
	const all = await listUsers();
	const registered = all.filter((u) => u.telegramProfile && u.clashProfile);

	const results = await Promise.all(
		registered.map(async (user) => {
			// biome-ignore lint/style/noNonNullAssertion: filtered above
			const id = user.telegramProfile!.id;
			const member = await getGroupMember(context.bot, id, true);
			if (!member) {
				return false;
			}
			await updateTelegramNames({
				id: Number(id),
				username: member.user.username,
				firstName: member.user.first_name,
				lastName: member.user.last_name,
			});
			return true;
		}),
	);

	const synced = results.filter(Boolean).length;
	await context.reply(`Sincronizzati ${synced} utenti (${all.length} utenti visti totali)`);
}
