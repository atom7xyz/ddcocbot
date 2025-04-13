import type { Bot, MessageContext } from "gramio";
import { checkPrivateChat } from "utils";

const onlyPrivateChatKeyboard = (context: MessageContext<Bot>) => {
	const privateChat = checkPrivateChat(context);

	if (privateChat) {
		return [];
	}

	return [
		[
			{
				text: "Apri in chat privata",
				url: "https://t.me/ddcocbot?start=start",
			},
		],
	];
};

const notRegisteredKeyboard = [
	[
		{
			text: "Registrati",
			url: "https://t.me/ddcocbot?start=start",
		},
	],
];

const suggestClashOfStatsKeyboard = (name: string, tag: string) => [
	[
		{
			text: "Clash of Stats",
			url: `https://www.clashofstats.com/players/${name}-${tag.replace("#", "")}/summary`,
		},
	],
];

const startKeyboard = [
	[
		{
			text: "Iniziamo!",
			callback_data: "start",
		},
	],
];

const tagKeyboard = [
	[
		{
			text: "Dove trovo il mio TAG?",
			callback_data: "howto_tag",
		},
	],
];

const apiTokenKeyboard = [
	[
		{
			text: "Dove trovo il mio API Token?",
			callback_data: "howto_api_token",
		},
	],
];

export {
	onlyPrivateChatKeyboard,
	notRegisteredKeyboard,
	startKeyboard,
	tagKeyboard,
	apiTokenKeyboard,
	suggestClashOfStatsKeyboard,
};
