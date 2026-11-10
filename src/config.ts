import env from "env-var";
import { normalizeTag } from "./lib/tags.ts";

export const config = {
	NODE_ENV: env.get("NODE_ENV").default("development").asEnum(["production", "test", "development"]),
	BOT_TOKEN: env.get("BOT_TOKEN").required().asString(),

	DATABASE_URL: env.get("DATABASE_URL").required().asUrlString(),

	/** Telegram supergroup the bot manages (negative chat ID, e.g. -100123...). */
	GROUP_ID: env.get("GROUP_ID").required().asInt(),

	/** Telegram user ID allowed to run owner-only commands. */
	OWNER_TELEGRAM_ID: env.get("OWNER_TELEGRAM_ID").default("189384600").asIntPositive(),

	/** Public username of the bot, without "@". Used for deep links. */
	BOT_USERNAME: env.get("BOT_USERNAME").default("ddcocbot").asString(),

	COC_API: {
		URL: env.get("COC_API_URL").default("https://api.clashofclans.com/v1").asUrlString(),
		TOKEN: env.get("COC_API_TOKEN").required().asString(),
	},

	COC_CLAN_TAG: normalizeTag(env.get("COC_CLAN_TAG").required().asString()),
};
