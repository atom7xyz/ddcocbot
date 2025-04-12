import env from "env-var";

export const config = {
	NODE_ENV: env
		.get("NODE_ENV")
		.default("development")
		.asEnum(["production", "test", "development"]),
	BOT_TOKEN: env.get("BOT_TOKEN").required().asString(),

	DATABASE_URL: env.get("DATABASE_URL").required().asString(),
	LOCK_STORE: env.get("LOCK_STORE").default("memory").asEnum(["memory"]),
	GROUP_ID: env.get("GROUP_ID").required().asString(),

	// Clash of Clans API Configuration
	COC_API: {
		URL: env
			.get("COC_API_URL")
			.default("https://api.clashofclans.com/v1")
			.asString(),
		TOKEN: env.get("COC_API_TOKEN").required().asString(),
	},

	COC_CLAN_TAG: env.get("COC_CLAN_TAG").required().asString(),
};
