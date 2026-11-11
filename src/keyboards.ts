import { InlineKeyboard } from "gramio";
import { config } from "./config.ts";

export const CallbackData = {
	start: "start",
	howtoTag: "howto_tag",
	howtoApiToken: "howto_api_token",
} as const;

const registerUrl = () => `https://t.me/${config.BOT_USERNAME}?start=start`;

export const openPrivateChatKeyboard = () => new InlineKeyboard().url("Apri in chat privata", registerUrl());

export const notRegisteredKeyboard = () => new InlineKeyboard().url("Registrati", registerUrl());

export const startKeyboard = () => new InlineKeyboard().text("Iniziamo!", CallbackData.start);

export const tagHelpKeyboard = () => new InlineKeyboard().text("Dove trovo il mio TAG?", CallbackData.howtoTag);

export const apiTokenHelpKeyboard = () =>
	new InlineKeyboard().text("Dove trovo la mia Chiave API?", CallbackData.howtoApiToken);

export const clashOfStatsKeyboard = (name: string, tag: string) =>
	new InlineKeyboard().url(
		"Clash of Stats",
		`https://www.clashofstats.com/players/${encodeURIComponent(name)}-${tag.replace("#", "")}/summary`,
	);
