import type { Bot } from "gramio";
import { adminsOnly, membersOnly, ownerOnly, privateOnly } from "../handlers/guards.ts";
import { CallbackData } from "../keyboards.ts";
import { banCommand } from "./ban.ts";
import { clanCommand } from "./clan.ts";
import { dropCommand } from "./drop.ts";
import { dumpCommand } from "./dump.ts";
import { leftChatMemberHandler, newChatMembersHandler } from "./groupEvents.ts";
import { helpCommand } from "./help.ts";
import { membersCommand } from "./members.ts";
import { profileCommand } from "./profile.ts";
import { registerCommand } from "./register.ts";
import { conversationHandler, howtoApiTokenCallback, howtoTagCallback, startCallback, startCommand } from "./start.ts";
import { syncCommand } from "./sync.ts";
import { usersCommand } from "./users.ts";

/** Registers every handler. Call once, before `bot.start()`. */
export function registerHandlers(bot: Bot): Bot {
	return bot
		.command("start", privateOnly(startCommand))
		.command("help", helpCommand)
		.command("clan", membersOnly(clanCommand))
		.command("profile", membersOnly(profileCommand))
		.command("members", adminsOnly(membersCommand))
		.command("users", privateOnly(adminsOnly(usersCommand)))
		.command("sync", privateOnly(adminsOnly(syncCommand)))
		.command("ban", adminsOnly(banCommand))
		.command("register", privateOnly(ownerOnly(registerCommand)))
		.command("drop", privateOnly(ownerOnly(dropCommand)))
		.command("dump", privateOnly(ownerOnly(dumpCommand)))

		.callbackQuery(CallbackData.start, startCallback)
		.callbackQuery(CallbackData.howtoTag, howtoTagCallback)
		.callbackQuery(CallbackData.howtoApiToken, howtoApiTokenCallback)

		.on("new_chat_members", newChatMembersHandler)
		.on("left_chat_member", leftChatMemberHandler)
		.on("message", conversationHandler);
}
