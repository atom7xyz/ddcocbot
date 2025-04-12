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

export { startKeyboard, tagKeyboard, apiTokenKeyboard };
