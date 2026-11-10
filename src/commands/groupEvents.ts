import { config } from "../config.ts";
import type { LeftMemberCtx, NewMembersCtx } from "../handlers/context.ts";
import { forgetGroupMember } from "../services/api/index.ts";
import { findMember } from "../services/users.ts";

export async function newChatMembersHandler(context: NewMembersCtx): Promise<void> {
	if (context.chat.id !== config.GROUP_ID) {
		return;
	}

	for (const newMember of context.newChatMembers ?? []) {
		forgetGroupMember(newMember.id);
		const member = await findMember(newMember.id);
		if (member) {
			await context.reply(`Benvenuto ${newMember.firstName} (${member.clashProfile.name}) nel gruppo del clan!`);
		}
	}
}

export async function leftChatMemberHandler(context: LeftMemberCtx): Promise<void> {
	const left = context.leftChatMember;
	if (context.chat.id !== config.GROUP_ID || !left) {
		return;
	}

	forgetGroupMember(left.id);
	const member = await findMember(left.id);
	if (member) {
		await context.reply(`${left.firstName} (${member.clashProfile.name}) ha lasciato il gruppo.`);
	}
}
