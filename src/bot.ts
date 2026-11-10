import { autoRetry } from "@gramio/auto-retry";
import { Bot } from "gramio";
import { registerHandlers } from "./commands/index.ts";
import { config } from "./config.ts";

export const bot = registerHandlers(new Bot(config.BOT_TOKEN).extend(autoRetry()))
	.onError(({ context, kind, error }) => {
		console.error(`Unhandled ${kind} error in update ${context.updateId}:`, error);
	})
	.onStart(({ info }) => {
		console.log(`✨ Bot @${info.username} started.`);
	});
