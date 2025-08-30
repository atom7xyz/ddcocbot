import { autoRetry } from "@gramio/auto-retry";
import { Bot } from "gramio";
import { config } from "./config.ts";
import { registerEvents } from "./commands/index.ts";
import { telegramApiService } from "./services/api";

export const bot = new Bot(config.BOT_TOKEN)
	.extend(autoRetry())
	.onStart(({ info }) => {
		console.log(`✨ Bot ${info.username} was started!`);

		telegramApiService.setBot(bot);
		registerEvents(bot);
	});
