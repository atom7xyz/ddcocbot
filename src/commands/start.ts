import { getTelegramUser, getTelegramUserId } from "commands";
import { db, roleToEnum } from "db";
import { clashProfiles, telegramProfiles, users } from "db/schema";
import { eq } from "drizzle-orm";
import { type Bot, type MessageContext, format, italic } from "gramio";
import {
	clearConversation,
	ConversationState,
	getConversation,
	setConversation,
} from "services/convo/conversationState";
import { generateInviteLink } from "services/groupManager";
import { apiTokenKeyboard, startKeyboard } from "shared/keyboards";
import { cocApiService } from "services/api";
import { config } from "config";

/**
 * Handles the /start command to initiate user registration process
 *
 * This function:
 * 1. Checks if user is already registered
 * 2. Creates new user profile if needed
 * 3. Initiates conversation flow for registration
 * 4. Sets conversation state to WAITING_TAG
 *
 * @param context - The message context containing user information
 */
const start = async (context: MessageContext<Bot>) => {
	const telegramUser = getTelegramUser(context);

	// Check if user already exists in database
	const user = await db.query.users.findFirst({
		where: eq(users.telegramProfileId, telegramUser.id),
		with: {
			clashProfile: true,
			telegramProfile: true,
		},
	});

	// If user already has a Clash profile, welcome them back
	if (user?.clashProfile) {
		await context.send(
			`Bentornato, ${user.clashProfile.name}! Sei già registrato!`,
		);
		await context.send("Usa /help per vedere tutti i comandi disponibili.");
		return;
	}

	// Create new Telegram profile if it doesn't exist
	if (!user?.telegramProfile) {
		await db.insert(telegramProfiles).values({
			id: telegramUser.id,
			username: telegramUser.username,
			firstName: telegramUser.firstName,
			lastName: telegramUser.lastName,
		});

		await db.insert(users).values({
			telegramProfileId: telegramUser.id,
		});
	}

	// Send welcome message and start registration process
	await context.send(
		"Ciao e benvenuto nel nostro clan! 🎉\n\nPer poter accedere al nostro gruppo Telegram dovrai completare una breve registrazione.",
		{
			reply_markup: {
				inline_keyboard: startKeyboard,
			},
		},
	);

	// Set conversation state to wait for user's Clash tag
	setConversation(telegramUser.id, undefined, ConversationState.WAITING_TAG);
};

/**
 * Handles the user's Clash of Clans tag input
 *
 * This function:
 * 1. Validates the tag format
 * 2. Verifies the player exists and is in our clan
 * 3. Sets conversation state to WAITING_API_TOKEN
 *
 * @param message - The tag received from the user
 * @param context - The message context
 */
const tagSent = async (message: string, context: MessageContext<Bot>) => {
	const id = getTelegramUserId(context);

	// Validate tag format using regex
	const tagRegex = /^#[A-Z0-9]{6,10}$/;
	if (!tagRegex.test(message)) {
		await context.send(
			`Il tag "${message}" non è valido. Un tag valido deve:\n- Iniziare con il simbolo #\n- Contenere solo lettere maiuscole e numeri\n- Avere una lunghezza compresa tra 6 e 10 caratteri\nEsempio di tag valido: #2POR98UYJ`,
		);
		return;
	}

	// Verify player exists in Clash of Clans API
	const player = await cocApiService.getPlayer(message);
	if (!player || player.tag !== message) {
		await context.send(
			`Non è stato possibile trovare un giocatore con il tag "${message}".\nVerifica di aver inserito correttamente il tag e riprova.`,
		);
		return;
	}

	// Verify player is in our clan
	if (!player.clan || player.clan.tag !== config.COC_CLAN_TAG) {
		await context.send(
			`Il giocatore con tag "${message}" non è membro del nostro clan.\nPer completare la registrazione devi essere membro del nostro clan.`,
		);
		return;
	}

	// Proceed to API token step
	await context.react("👍");
	await context.send(
		format`Ora servirebbe che mi indicassi il tuo API Token, lo puoi trovare nella sezione ${italic`Impostazioni`} e poi ${italic`Altre impostazioni`} del tuo profilo di Clash of Clans.`,
		{
			reply_markup: {
				inline_keyboard: apiTokenKeyboard,
			},
		},
	);

	// Set conversation state to wait for API token
	setConversation(id, message, ConversationState.WAITING_API_TOKEN);
};

/**
 * Handles the user's API token input
 *
 * This function:
 * 1. Validates the token format
 * 2. Verifies the token matches the player's account
 * 3. Completes registration and adds user to database
 *
 * @param message - The API token received from the user
 * @param context - The message context
 */
const apiTokenSent = async (message: string, context: MessageContext<Bot>) => {
	const id = getTelegramUserId(context);

	// Validate token format
	if (message.length !== 8) {
		await context.send(
			`Il token "${message}" non è valido. Un token valido deve:\n- Essere esattamente di 8 caratteri\n- Contenere solo lettere e numeri\nVerifica di aver copiato correttamente il token e riprova.`,
		);
		return;
	}

	// Verify user exists in database
	const user = await db.query.users.findFirst({
		where: eq(users.telegramProfileId, id),
	});

	if (!user) {
		await context.send(
			"Errore critico: il tuo profilo utente non è stato trovato nel database.\n" +
				"Questo potrebbe essere dovuto a a un problema temporaneo del sistema.\n" +
				"Per favore riprova più tardi.",
		);
		return;
	}

	// Get current conversation state
	const conversation = getConversation(id);
	if (!conversation || !conversation.tag) {
		await context.send(
			"Errore di sistema: i dati della conversazione non sono stati trovati.\n" +
				"Questo potrebbe essere dovuto a un timeout della sessione.\n" +
				"Per favore riavvia la procedura di registrazione usando il comando /start.",
		);
		return;
	}

	// Verify API token matches player's account
	const tokenValid = await cocApiService.verifyPlayerToken(
		conversation.tag,
		message,
	);

	if (!tokenValid) {
		await context.send(
			`Il token "${message}" non è valido per il tag ${conversation.tag}.\nVerifica di aver copiato correttamente il token dal gioco e riprova.\nAssicurati di usare il token associato al tuo account Clash of Clans.`,
		);
		return;
	}

	// Get player data from API
	const player = await cocApiService.getPlayer(conversation.tag);
	console.log("Player:", player);

	if (!player) {
		await context.send(
			"Errore di sistema: impossibile recuperare i dati del giocatore.\n" +
				"Questo potrebbe essere dovuto a un problema temporaneo con i server di Clash of Clans.\n" +
				"Per favore riprova più tardi.",
		);
		return;
	}

	// Verify player is still in our clan
	if (!player.clan || player.clan.tag !== config.COC_CLAN_TAG) {
		await context.send(
			"Errore di sistema: impossibile verificare l'appartenenza al clan.\n" +
				"Assicurati di essere ancora membro del nostro clan e riprova.",
		);
		return;
	}

	// Get clan data from API
	const clan = await cocApiService.getClan(player.clan.tag);
	if (!clan) {
		await context.send(
			"Errore di sistema: impossibile recuperare i dati del clan.\n" +
				"Questo potrebbe essere dovuto a un problema temporaneo con i server de Clash of Clans.\n" +
				"Per favore riprova più tardi.",
		);
		return;
	}

	// Verify player is still in clan member list
	const foundInClan = clan.memberList.find(
		(member) => member.tag === conversation.tag,
	);

	if (!foundInClan) {
		await context.send(
			"Errore di sistema: impossibile determinare il tuo ruolo nel clan.\n" +
				"Assicurati di essere ancora membro del clan e riprova.",
		);
		return;
	}

	await db.insert(clashProfiles).values({
		tag: conversation.tag,
		name: player.name,
		role: roleToEnum(foundInClan.role),
	});

	await db
		.update(users)
		.set({
			clashProfileTag: conversation.tag,
		})
		.where(eq(users.telegramProfileId, id));

	clearConversation(id);

	await context.react("🎉");
	await context.send(
		"Registrazione completata!\nSei stato registrato come membro del clan.",
	);

	const link = await generateInviteLink(context.bot);
	await context.send(
		`Ti invitiamo a unirti al nostro gruppo: ${link.invite_link}`,
	);
};

export { start, tagSent, apiTokenSent };
