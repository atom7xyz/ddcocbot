export * from "./start.ts";

import { startCommand } from "./start.ts";
import { helpCommand } from "./help.ts";
import { clanCommand } from "./clan.ts";
import {
	callbackStart,
	callbackTag,
	callbackApiToken,
} from "shared/callback-data/index.ts";
import {
	chatHandler,
	leftChatMemberHandler,
	newChatMembersHandler,
} from "services/convo";
import { playerCommand } from "./profile.ts";
import { membersCommand } from "./members.ts";
import type { Bot, MessageContext } from "gramio";
import { usersCommand } from "./users.ts";
import {
	checkPrivateChat,
	checkUserIsAdmin,
	checkUserIsRegistered,
} from "utils.ts";
import {
	notRegisteredKeyboard,
	onlyPrivateChatKeyboard,
} from "shared/keyboards/index.ts";
import type { telegramProfiles, clashProfiles, users } from "db/schema.ts";
import { registerCommand } from "./register.ts";
import { syncCommand } from "./sync.ts";
import { banCommand } from "./ban.ts";
import { dropCommand } from "./drop.ts";

function registerEvents(bot: Bot) {
	bot
		.command("start", privateChatCommand(startCommand))
		.command("help", helpCommand)
		.command("clan", userCommand(clanCommand))
		.command("profile", userCommand(playerCommand))
		.command("members", userCommand(adminCommand(membersCommand)))
		.command(
			"users",
			privateChatCommand(userCommand(adminCommand(usersCommand))),
		)
		.command(
			"register",
			privateChatCommand(userCommand(adminCommand(registerCommand))),
		)
		.command("sync", privateChatCommand(userCommand(adminCommand(syncCommand))))
		.command("ban", userCommand(adminCommand(banCommand)))
		.command("drop", privateChatCommand(userCommand(adminCommand(dropCommand))))

		.callbackQuery("start", callbackStart)
		.callbackQuery("howto_tag", callbackTag)
		.callbackQuery("howto_api_token", callbackApiToken)

		.on("message", privateChatCommand(chatHandler, false))

		.on("new_chat_members", newChatMembersHandler)
		.on("left_chat_member", leftChatMemberHandler);
}

function userCommand(
	func: (
		context: MessageContext<Bot>,
		user: typeof users.$inferSelect,
		userClashProfile: typeof clashProfiles.$inferSelect,
		userTelegramProfile: typeof telegramProfiles.$inferSelect,
	) => Promise<void>,
) {
	return async (context: MessageContext<Bot>) => {
		const user = await checkUserIsRegistered(context);

		if (!user) {
			await context.reply("Non sei registrato nel nostro sistema.", {
				reply_markup: {
					inline_keyboard: notRegisteredKeyboard,
				},
			});
			return;
		}

		const userClashProfile = user.clashProfile;
		const userTelegramProfile = user.telegramProfile;

		if (!userClashProfile) {
			await context.reply("Non hai un profilo Clash of Clans associato.", {
				reply_markup: {
					inline_keyboard: notRegisteredKeyboard,
				},
			});
			return;
		}

		if (!userTelegramProfile) {
			await context.reply("Non hai un profilo Telegram associato.", {
				reply_markup: {
					inline_keyboard: notRegisteredKeyboard,
				},
			});
			return;
		}

		await context.sendChatAction("typing");
		return func(context, user, userClashProfile, userTelegramProfile);
	};
}

function adminCommand(
	func: (
		context: MessageContext<Bot>,
		user: typeof users.$inferSelect,
		userClashProfile: typeof clashProfiles.$inferSelect,
		userTelegramProfile: typeof telegramProfiles.$inferSelect,
	) => Promise<void>,
) {
	return async (
		context: MessageContext<Bot>,
		user: typeof users.$inferSelect,
		userClashProfile: typeof clashProfiles.$inferSelect,
		userTelegramProfile: typeof telegramProfiles.$inferSelect,
	) => {
		const isAdmin = await checkUserIsAdmin(context);

		if (!isAdmin) {
			await context.reply("Non sei autorizzato a utilizzare questo comando.");
			return;
		}

		await context.sendChatAction("typing");
		return func(context, user, userClashProfile, userTelegramProfile);
	};
}

function privateChatCommand(
	func: (
		context: MessageContext<Bot>,
		user: typeof users.$inferSelect | null | undefined,
		userClashProfile: typeof clashProfiles.$inferSelect | null | undefined,
		userTelegramProfile:
			| typeof telegramProfiles.$inferSelect
			| null
			| undefined,
	) => Promise<void>,
	alert = true,
) {
	return async (context: MessageContext<Bot>) => {
		const isPrivateChat = checkPrivateChat(context);

		if (!isPrivateChat) {
			if (!alert) {
				return;
			}

			await context.reply(
				"Questo comando funziona solo in chat privata. Clicca sul pulsante qui sotto.",
				{
					reply_markup: {
						inline_keyboard: onlyPrivateChatKeyboard(context),
					},
				},
			);
			return;
		}

		const user = await checkUserIsRegistered(context);
		const userClashProfile = user?.clashProfile;
		const userTelegramProfile = user?.telegramProfile;

		return func(context, user, userClashProfile, userTelegramProfile);
	};
}

export { registerEvents };
