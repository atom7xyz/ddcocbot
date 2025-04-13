import type { Bot, MessageContext } from "gramio";
import { clashProfiles, telegramProfiles, users } from "db/schema";
import { cocApiService } from "services/api";
import { db, roleToEnum } from "db";
import { eq } from "drizzle-orm";

export const registerCommand = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect | null | undefined,
	userClashProfile: typeof clashProfiles.$inferSelect | null | undefined,
	userTelegramProfile: typeof telegramProfiles.$inferSelect | null | undefined,
) => {
	const split = context.text?.split(" ");
	const argLength = split?.length ?? 0;

	if (!split || argLength !== 3) {
		await context.reply("Utilizzo: /register <tag> <telegram_id> 1");
		return;
	}

	const tag = split[1];
	const telegramId = split[2];

	if (!tag || !telegramId) {
		await context.reply("Utilizzo: /register <tag> <telegram_id>");
		return;
	}

	const player = await cocApiService.getPlayer(tag);

	if (!player) {
		await context.reply(`${tag} non trovato.`);
		return;
	}

	if (!player.clan) {
		await context.reply(`${tag} non è membro di alcun clan.`);
		return;
	}

	const clan = await cocApiService.getClan(player.clan.tag);

	if (!clan) {
		await context.reply("Clan non trovato");
		return;
	}

	const userCheck = await db.query.users.findFirst({
		where: eq(users.telegramProfileId, BigInt(telegramId)),
	});

	if (userCheck) {
		await context.reply(`${telegramId} è già registrato`);
		return;
	}

	const clashCheck = await db.query.clashProfiles.findFirst({
		where: eq(clashProfiles.tag, tag),
	});

	if (clashCheck) {
		await context.reply(`${tag} è già registrato`);
		return;
	}

	const telegramCheck = await db.query.telegramProfiles.findFirst({
		where: eq(telegramProfiles.id, BigInt(telegramId)),
	});

	if (telegramCheck) {
		await context.reply(`${telegramId} è già registrato`);
		return;
	}

	const role = clan.memberList.find((member) => member.tag === tag)?.role;

	await db.insert(clashProfiles).values({
		tag,
		name: player.name,
		role: roleToEnum(role) as
			| "leader"
			| "coleader"
			| "elder"
			| "member"
			| "none",
	});

	await db.insert(telegramProfiles).values({
		id: BigInt(telegramId),
	});

	await db.insert(users).values({
		telegramProfileId: BigInt(telegramId),
		clashProfileTag: tag,
	});

	await context.reply(
		`Registrato con successo:\n\nTag: ${tag}\nNome: ${player.name}\nRuolo: ${role}\nTelegram ID: ${telegramId}`,
	);
};
