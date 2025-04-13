import type { Bot, MessageContext } from "gramio";

const helpMessage = `
Comandi del Bot:

Registrazione
/start - Comando base

Informazioni Giocatore
/profile #TAG - Mostra informazioni su un giocatore (anche via #TAG)

Informazioni Clan
/clan - Mostra informazioni su un clan (anche via #TAG)
/members - Elenca tutti i membri di un clan (anche via #TAG)

Comandi Amministrativi
/ban #TAG - Banna un utente dal gruppo (solo co-leaders) (via #TAG)
/users - Mostra tutti gli utenti registrati (solo co-leaders)
/sync - Sincronizza gli utenti (solo co-leaders)

Altro
/help - Mostra la lista dei comandi
`;

const helpCommand = async (context: MessageContext<Bot>) => {
	await context.reply(helpMessage);
};

export { helpCommand };
