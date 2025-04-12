export * from "./start.ts";

import type { Bot, MessageContext, User } from "gramio";
import { start } from "./start.ts";
import {
	callbackStart,
	callbackTag,
	callbackApiToken,
} from "shared/callback-data/index.ts";
import { chatHandler } from "services/convo";

function registerCommands(bot: Bot) {
	bot
		.command("start", start)
		.callbackQuery("start", callbackStart)
		.callbackQuery("howto_tag", callbackTag)
		.on("message", chatHandler);
}

function registerCallbackQueries(bot: Bot) {
	bot
		.callbackQuery("start", callbackStart)
		.callbackQuery("howto_tag", callbackTag)
		.callbackQuery("howto_api_token", callbackApiToken);
}

function registerMessages(bot: Bot) {
	bot.on("message", chatHandler);
}

function getTelegramUser(context: MessageContext<Bot>): User {
	return context.from!;
}

function getTelegramUserId(context: MessageContext<Bot>): number {
	return getTelegramUser(context).id;
}

export {
	registerCommands,
	registerCallbackQueries,
	registerMessages,
	getTelegramUser,
	getTelegramUserId,
};
