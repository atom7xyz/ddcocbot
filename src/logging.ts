/**
 * Import this module first in every entry point. It patches the console
 * before any other module can log a secret.
 */
import { config } from "./config.ts";
import { createRedactor, redactConsole } from "./lib/redact.ts";

function databasePassword(url: string): string | undefined {
	try {
		return decodeURIComponent(new URL(url).password) || undefined;
	} catch {
		return undefined;
	}
}

redactConsole(createRedactor([config.BOT_TOKEN, config.COC_API.TOKEN, databasePassword(config.DATABASE_URL)]));
