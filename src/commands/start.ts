import { format, italic } from "gramio";
import { config } from "../config.ts";
import type { CallbackCtx, CommandCtx, MessageCtx } from "../handlers/context.ts";
import { apiTokenHelpKeyboard, startKeyboard, tagHelpKeyboard } from "../keyboards.ts";
import { toDbRole } from "../lib/roles.ts";
import { parseTag } from "../lib/tags.ts";
import { cocApiService, createGroupInviteLink } from "../services/api/index.ts";
import { clearConversation, getConversation, setConversation } from "../services/conversations.ts";
import { sendAssetPhoto } from "../services/photos.ts";
import {
	findMember,
	findUserByTag,
	linkClashProfile,
	type TelegramIdentity,
	upsertTelegramUser,
} from "../services/users.ts";

const TAG_EXAMPLE = "#2P0R98UYJ";
const API_TOKEN_PATTERN = /^[a-z0-9]{8}$/i;

/** Step-by-step screenshots for finding the API key, sent in this order. */
const API_KEY_STEPS = [
	{
		asset: "howto-api-key-1.jpg",
		caption: format`1️⃣ Tocca l'icona del tuo profilo in alto a sinistra.`,
	},
	{
		asset: "howto-api-key-2.jpg",
		caption: format`2️⃣ Apri la scheda ${italic("Impostazioni")} e tocca ${italic("Altre impostazioni")}.`,
	},
	{
		asset: "howto-api-key-3.jpg",
		caption: format`3️⃣ Nella sezione ${italic("Chiave API")}, tocca ${italic("Mostra")}.`,
	},
	{
		asset: "howto-api-key-4.jpg",
		caption: format`4️⃣ Tocca ${italic("Copia")} e incolla qui la tua Chiave API.`,
	},
] as const;

function identityOf(from: {
	id: number;
	username?: string | undefined;
	firstName: string;
	lastName?: string | undefined;
}): TelegramIdentity {
	return { id: from.id, username: from.username, firstName: from.firstName, lastName: from.lastName };
}

/** /start — entry point of the registration flow. Private chat only. */
export async function startCommand(context: CommandCtx): Promise<void> {
	const member = await findMember(context.from.id);

	if (member) {
		await context.reply(`Bentornato, ${member.clashProfile.name}! Sei già registrato!`);
		await context.send("Usa /help per vedere tutti i comandi disponibili.");
		return;
	}

	await upsertTelegramUser(identityOf(context.from));

	await context.reply(
		"Ciao e benvenuto nel nostro clan! 🎉\n\nPer poter accedere al nostro gruppo Telegram dovrai completare una breve registrazione.",
		{ reply_markup: startKeyboard() },
	);
}

/** "Iniziamo!" button: asks for the player tag. */
export async function startCallback(context: CallbackCtx): Promise<void> {
	await context.answerCallbackQuery({ text: "👍" });

	if (await findMember(context.from.id)) {
		await context.send("Sei già registrato! Usa /help per vedere tutti i comandi disponibili.");
		return;
	}

	setConversation(context.from.id, { step: "waiting_tag" });

	await context.send(
		`Per prima cosa, servirebbe che mi indicassi il tuo TAG, lo puoi trovare nel tuo profilo di Clash of Clans (esempio: ${TAG_EXAMPLE}).`,
		{ reply_markup: tagHelpKeyboard() },
	);
}

export async function howtoTagCallback(context: CallbackCtx): Promise<void> {
	await context.answerCallbackQuery({ text: "👍" });
	await context.sendChatAction("upload_photo");
	await sendAssetPhoto(
		context,
		"howto-tag.jpg",
		`Puoi trovare il tuo TAG nel tuo profilo di Clash of Clans, sotto il tuo nome (esempio: ${TAG_EXAMPLE}).`,
	);
}

export async function howtoApiTokenCallback(context: CallbackCtx): Promise<void> {
	await context.answerCallbackQuery({ text: "👍" });
	await context.sendChatAction("upload_photo");
	for (const step of API_KEY_STEPS) {
		await sendAssetPhoto(context, step.asset, step.caption);
	}
}

/**
 * Routes private, non-command messages to the current registration step.
 * Messages from users without an active conversation are ignored.
 */
export async function conversationHandler(context: MessageCtx): Promise<void> {
	// Commands are never answers to a registration step.
	if (context.chat.type !== "private" || !context.text || context.text.startsWith("/")) {
		return;
	}

	const conversation = getConversation(context.from.id);

	if (conversation?.step === "waiting_tag") {
		await handleTag(context, context.text);
	} else if (conversation?.step === "waiting_api_token") {
		await handleApiToken(context, context.text, conversation.tag);
	}
}

async function handleTag(context: MessageCtx, input: string): Promise<void> {
	const tag = parseTag(input);

	if (!tag) {
		await context.reply(
			`Il tag "${input}" non è valido.\n\nUn tag valido contiene solo i caratteri 0 2 8 9 P Y L Q G R J C U V.\nEsempio di tag valido: ${TAG_EXAMPLE}`,
		);
		return;
	}

	await context.sendChatAction("typing");

	const owner = await findUserByTag(tag);
	if (owner?.clashProfile && owner.telegramProfileId !== BigInt(context.from.id)) {
		await context.reply(
			`${owner.clashProfile.name} (${tag}) è già registrato come membro del nostro clan! Riprova con un altro tag.`,
		);
		return;
	}

	const player = await cocApiService.getPlayer(tag);
	if (!player) {
		await context.reply(
			`Non è stato possibile trovare un giocatore con il tag "${tag}".\nVerifica di aver inserito correttamente il tag e riprova.`,
		);
		return;
	}

	if (player.clan?.tag !== config.COC_CLAN_TAG) {
		await context.reply(
			`Il giocatore con tag "${tag}" non è membro del nostro clan.\nPer completare la registrazione devi essere membro del nostro clan.`,
		);
		return;
	}

	setConversation(context.from.id, { step: "waiting_api_token", tag });

	await context.react("👍");
	await context.reply(
		format`Ora servirebbe che mi indicassi la tua Chiave API, la puoi trovare nella sezione ${italic("Impostazioni")} e poi ${italic("Altre impostazioni")} del tuo profilo di Clash of Clans.`,
		{ reply_markup: apiTokenHelpKeyboard() },
	);
}

async function handleApiToken(context: MessageCtx, input: string, tag: string): Promise<void> {
	const token = input.trim();

	if (!API_TOKEN_PATTERN.test(token)) {
		await context.reply(
			"La Chiave API non è valida. Una Chiave API valida:\n- È lunga esattamente 8 caratteri\n- Contiene solo lettere e numeri\nVerifica di aver copiato correttamente la Chiave API e riprova.",
		);
		return;
	}

	await context.sendChatAction("typing");

	if (!(await cocApiService.verifyPlayerToken(tag, token))) {
		await context.reply(
			`La Chiave API non è valida per il tag ${tag}.\n\nLa Chiave API cambia ogni pochi minuti: copia quella attuale dal gioco e riprova.`,
		);
		return;
	}

	const [player, clan] = await Promise.all([
		cocApiService.getPlayer(tag, true),
		cocApiService.getClan(config.COC_CLAN_TAG, true),
	]);

	if (!player || !clan) {
		await context.reply(
			"Errore: impossibile recuperare i dati da Clash of Clans.\nPotrebbe essere un problema temporaneo dei server. Per favore riprova più tardi.",
		);
		return;
	}

	const clanMember = clan.memberList.find((m) => m.tag === tag);
	if (!clanMember) {
		await context.reply("Non risulti più membro del nostro clan. Rientra nel clan e riprova con /start.");
		clearConversation(context.from.id);
		return;
	}

	const result = await linkClashProfile(identityOf(context.from), {
		tag,
		name: player.name,
		role: toDbRole(clanMember.role),
	});

	clearConversation(context.from.id);

	if (result === "tag_taken") {
		await context.reply(`${tag} è già registrato da un altro utente.`);
		return;
	}

	await context.react("🎉");
	await context.reply("Registrazione completata!\nSei stato registrato come membro del clan.");

	try {
		const link = await createGroupInviteLink(context.bot, player.name);
		await context.send(`Ti invitiamo a unirti al nostro gruppo (link valido 24 ore, monouso): ${link}`);
	} catch (error) {
		console.error("Cannot create the group invite link:", error);
		await context.send("Non è stato possibile creare il link di invito. Contatta un amministratore.");
	}
}
