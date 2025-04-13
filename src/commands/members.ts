import { format, type Bot, type MessageContext } from "gramio";
import { cocApiService } from "services/api";
import type { Clan, ClanMember } from "services/api/models/cocModels";
import type { clashProfiles, telegramProfiles, users } from "db/schema";

const membersMessage = (clan: Clan, members: ClanMember[]) => `
Membri del clan ${clan.name} (${clan.tag}):\n\n${sortMembersByRole(members)
	.map(
		(member) =>
			`${memberRoleMessage(member.role)} — ${member.name} (${member.tag})`,
	)
	.join("\n")}
`;

const sortMembersByRole = (members: ClanMember[]) => {
	const rolePriority = {
		leader: 1,
		coLeader: 2,
		admin: 3,
		member: 4,
	};
	return members.sort((a, b) => {
		const roleComparison =
			rolePriority[a.role as keyof typeof rolePriority] -
			rolePriority[b.role as keyof typeof rolePriority];
		return roleComparison !== 0 ? roleComparison : a.expLevel - b.expLevel;
	});
};

const memberRoleMessage = (role: string) => {
	switch (role.toLowerCase()) {
		case "leader":
			return "capo";
		case "coleader":
			return "co-capo";
		case "admin":
			return "anziano";
		case "member":
			return "membro";
		default:
			return "?";
	}
};

const membersCommand = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	const split = context.text?.split(" ");
	const argLength = split?.length ?? 0;

	if (split && argLength > 1) {
		await getMembers(context, split[1]);
		return;
	}

	const player = await cocApiService.getPlayer(userClashProfile.tag);

	if (!player) {
		await context.reply(
			"Non è stato possibile recuperare le informazioni del tuo clan.",
		);
		return;
	}

	if (!player.clan) {
		await context.reply("Non sei membro di nessun clan.");
		return;
	}

	await getMembers(context, player.clan.tag);
};

const getMembers = async (
	context: MessageContext<Bot>,
	tag: string | undefined,
) => {
	if (!tag) {
		await context.reply("Per favore, fornisci un tag di clan valido.");
		return;
	}

	const clan = await cocApiService.getClan(tag);

	if (!clan) {
		await context.reply(
			"Non è stato possibile recuperare le informazioni del clan.",
		);
		return;
	}

	const members = clan.memberList;

	await context.reply(
		format`${membersMessage(clan, members)}\n(${clan.memberList.length} membri totali)`,
	);
};

export { membersCommand };
