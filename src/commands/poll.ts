import { db } from "db";
import {
	type users,
	type clashProfiles,
	type telegramProfiles,
	polls,
	pollVotes,
} from "db/schema";
import type { Bot, MessageContext } from "gramio";
import { eq } from "drizzle-orm";

export const pollCommand = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	const split = context.text?.split(" ");
	const argLength = split?.length ?? 0;

	if (!split || argLength !== 2) {
		await context.reply(
			"Utilizzo: /poll <domanda> <opzione1> <opzione2> ... (fino a 10 opzioni)",
		);
		return;
	}

	const question = split[1];
	const options = split.slice(2);

	if (options.length < 2) {
		await context.reply("Devi fornire almeno due opzioni.");
		return;
	}

	if (options.length > 10) {
		await context.reply("Puoi fornire al massimo 10 opzioni.");
		return;
	}

	if (!question) {
		await context.reply("Devi fornire una domanda.");
		return;
	}

	await db.insert(polls).values({
		question,
		options: options,
	});

	await context.sendPoll({
		question,
		options: options.map((option) => ({ text: option })),
	});

	await context.react("👍");
};

export const getPoll = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect,
	userClashProfile: typeof clashProfiles.$inferSelect,
	userTelegramProfile: typeof telegramProfiles.$inferSelect,
) => {
	const split = context.text?.split(" ");
	const argLength = split?.length ?? 0;

	if (!split || argLength !== 2) {
		await context.reply("Utilizzo: /getpoll <id>");
		return;
	}

	const pollId = split[1] ? BigInt(split[1]) : null;

	if (!pollId) {
		await context.reply("L'ID del sondaggio deve essere un numero.");
		return;
	}

	const poll = await db.query.polls.findFirst({
		where: eq(polls.id, Number(pollId)),
	});

	if (!poll) {
		await context.reply("Sondaggio non trovato.");
		return;
	}

	const votes = await db.query.pollVotes.findMany({
		where: eq(pollVotes.pollId, pollId),
		with: {
			user: true,
			telegramProfile: true,
			clashProfile: true,
		},
	});

	if (!poll.options) {
		await context.reply("Sondaggio senza opzioni.");
		return;
	}

	const usersVotesMap = votes.map((vote) => {
		return {
			text: vote.optionIndex,
			users: vote.user as typeof users.$inferSelect,
			telegramProfile:
				vote.telegramProfile as typeof telegramProfiles.$inferSelect,
			clashProfile: vote.clashProfile as typeof clashProfiles.$inferSelect,
		};
	});

	const matrix = [];

	for (const option of poll.options) {
		matrix.push([option]);
	}

	for (const vote of usersVotesMap) {
		const optionIndex = Number(vote.text);

		if (!matrix[optionIndex]) {
			matrix[optionIndex] = [];
		}

		const username =
			vote.telegramProfile?.username ||
			vote.clashProfile?.name ||
			`User ${vote.users.id}`;

		matrix[optionIndex].push(username);
	}

	const message = matrix.map((option) => {
		return `[${option[0]}]
        - ${option[1]}
        - ${option[2]}
        `;
	});

	await context.reply(message.join("\n"));
};
