import { autoRetry } from "@gramio/auto-retry";
import { prompt } from "@gramio/prompt";
import { Bot } from "gramio";
import { config } from "./config.ts";
import {
	registerCommands,
	registerCallbackQueries,
	registerMessages,
} from "./commands/index.ts";
import { telegramApiService } from "./services/api";

export const bot = new Bot(config.BOT_TOKEN)
	.extend(autoRetry())
	.extend(prompt())
	.onStart(({ info }) => {
		console.log(`✨ Bot ${info.username} was started!`);

		telegramApiService.setBot(bot);
		registerCommands(bot);
		registerCallbackQueries(bot);
		registerMessages(bot);
	});
