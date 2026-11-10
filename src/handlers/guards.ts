import { notRegisteredKeyboard, openPrivateChatKeyboard } from "../keyboards.ts";
import { findMember, isClanAdmin, isOwner, type Member } from "../services/users.ts";
import type { CommandCtx, MessageCtx } from "./context.ts";

type MemberHandler = (context: CommandCtx, member: Member) => Promise<unknown>;
type PlainHandler = (context: CommandCtx) => Promise<unknown>;

const NOT_AUTHORIZED = "Non sei autorizzato a utilizzare questo comando.";

export function isPrivateChat(context: MessageCtx): boolean {
	return context.chat.type === "private";
}

/** Replies with a deep link when the command is used outside a private chat. */
export function privateOnly(handler: PlainHandler): PlainHandler {
	return async (context) => {
		if (!isPrivateChat(context)) {
			await context.reply("Questo comando funziona solo in chat privata. Clicca sul pulsante qui sotto.", {
				reply_markup: openPrivateChatKeyboard(),
			});
			return;
		}
		await handler(context);
	};
}

/** Runs the handler only for users who completed the registration. */
export function membersOnly(handler: MemberHandler): PlainHandler {
	return async (context) => {
		const member = await findMember(context.from.id);

		if (!member) {
			await context.reply("Non sei registrato nel nostro sistema.", {
				reply_markup: notRegisteredKeyboard(),
			});
			return;
		}

		await context.sendChatAction("typing");
		await handler(context, member);
	};
}

/** Runs the handler only for registered leaders and co-leaders of the clan. */
export function adminsOnly(handler: MemberHandler): PlainHandler {
	return membersOnly(async (context, member) => {
		if (!(isOwner(context.from.id) || (await isClanAdmin(member)))) {
			await context.reply(NOT_AUTHORIZED);
			return;
		}
		await handler(context, member);
	});
}

/** Runs the handler only for the configured bot owner. */
export function ownerOnly(handler: PlainHandler): PlainHandler {
	return async (context) => {
		if (!isOwner(context.from.id)) {
			await context.reply(NOT_AUTHORIZED);
			return;
		}
		await context.sendChatAction("typing");
		await handler(context);
	};
}
