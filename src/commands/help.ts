import type { Bot, MessageContext } from "gramio";

const helpMessage = `
Comandi del Bot:

Registrazione
/start - Inizia il processo di registrazione

Informazioni Giocatore
/me - Mostra le tue informazioni
/player #TAG - Mostra informazioni su un giocatore specifico

Informazioni Clan
/clan - Mostra informazioni sul nostro clan
/clan #TAG - Mostra informazioni su un clan specifico
/members - Elenca tutti i membri del nostro clan
/members #TAG - Elenca tutti i membri di un clan specifico

Comandi Amministrativi
/kick - Rimuove un utente dal gruppo (solo co-leaders)
/users - Mostra tutti gli utenti registrati (solo co-leaders)

Altro
/help - Mostra questo messaggio di aiuto
`;

const helpCommand = async (context: MessageContext<Bot>) => {
	await context.reply(helpMessage);
};

export { helpCommand };
