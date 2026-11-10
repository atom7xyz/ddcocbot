import type { CommandCtx } from "../handlers/context.ts";

const HELP = `Comandi del Bot:

Registrazione
/start - Avvia la registrazione (in chat privata)

Informazioni Giocatore
/profile [#TAG | nome] - Mostra informazioni su un giocatore

Informazioni Clan
/clan [#TAG] - Mostra informazioni su un clan
/members [#TAG] - Elenca i membri di un clan (solo co-leaders)

Comandi Amministrativi
/ban #TAG - Rimuove un utente dal gruppo (solo co-leaders)
/users [all] - Mostra gli utenti registrati (solo co-leaders)
/sync - Sincronizza i nomi Telegram degli utenti (solo co-leaders)

Altro
/help - Mostra la lista dei comandi`;

export async function helpCommand(context: CommandCtx): Promise<void> {
	await context.reply(HELP);
}
