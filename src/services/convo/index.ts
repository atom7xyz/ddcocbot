import { getTelegramUserId } from "utils";
import { apiTokenSent } from "commands/start";
import { tagSent } from "commands/start";
import type {
	Bot,
	LeftChatMemberContext,
	MessageContext,
	NewChatMembersContext,
	PollContext,
} from "gramio";
import {
	ConversationState,
	getConversation,
} from "services/convo/conversationState";
import { type clashProfiles, type telegramProfiles, users } from "db/schema.ts";
import { db } from "db/index.ts";
import { eq } from "drizzle-orm";

/**
 * Handles the conversation state for a user by processing incoming messages
 * based on the current conversation state.
 *
 * This function:
 * 1. Gets the user's ID from the message context
 * 2. Retrieves the current conversation state for the user
 * 3. Processes the message based on the conversation state:
 *    - If waiting for a tag, calls the tagSent handler
 *    - If waiting for an API token, calls the apiTokenSent handler
 *
 * @param context - The message context containing the user's message and metadata
 * @returns Promise<void> - Returns early if no active conversation exists
 */
const chatHandler = async (
	context: MessageContext<Bot>,
	user: typeof users.$inferSelect | null | undefined,
	userClashProfile: typeof clashProfiles.$inferSelect | null | undefined,
	userTelegramProfile: typeof telegramProfiles.$inferSelect | null | undefined,
) => {
	// Get the user's Telegram ID from the message context
	const id = getTelegramUserId(context);

	// Retrieve the current conversation state for this user
	const conversation = getConversation(id);

	// If no active conversation exists, return early
	if (!conversation) {
		return;
	}

	// Get the message text or default to empty string if undefined
	const message = context.text ?? "";

	// Handle message based on current conversation state
	if (conversation.state === ConversationState.WAITING_TAG) {
		// Process message as tag
		await tagSent(
			message,
			context,
			user,
			userClashProfile,
			userTelegramProfile,
		);
		return;
	}

	if (conversation.state === ConversationState.WAITING_API_TOKEN) {
		// Process message as API token
		await apiTokenSent(
			message,
			context,
			user,
			userClashProfile,
			userTelegramProfile,
		);
		return;
	}
};

/**
 * Handles the new chat members event by welcoming new members to the group
 * and processing their messages if they are registered users.
 *
 * This function:
 * 1. Retrieves the new chat members from the context
 * 2. Checks if there are any new members
 * 3. Iterates through each new member
 * 4. Queries the database to find the user's registration status
 * 5. If the user is registered, welcomes them to the group
 * 6. If the user is not registered, continues to the next member
 *
 * @param context - The new chat members context containing the new members
 * @returns Promise<void> - Returns early if no new members are found
 */
const newChatMembersHandler = async (context: NewChatMembersContext<Bot>) => {
	const newChatMembers = context.newChatMembers;

	if (!newChatMembers || newChatMembers.length === 0) {
		return;
	}

	for (const member of newChatMembers) {
		const user = await db.query.users.findFirst({
			where: eq(users.telegramProfileId, BigInt(member.id)),
			with: {
				clashProfile: true,
			},
		});

		if (!user) {
			continue;
		}

		await context.reply(
			`Benvenuto ${member.firstName} (${user.clashProfile?.name}) nel gruppo del clan!`,
		);
	}
	return;
};

/**
 * Handles the left chat member event by welcoming new members to the group
 * and processing their messages if they are registered users.
 *
 * This function:
 * 1. Retrieves the left chat member from the context
 * 2. Checks if there are any left chat members
 * 3. Iterates through each left chat member
 * 4. Queries the database to find the user's registration status
 * 5. If the user is registered, welcomes them to the group
 * 6. If the user is not registered, continues to the next member
 *
 * @param context - The left chat member context containing the left members
 * @returns Promise<void> - Returns early if no left members are found
 */
const leftChatMemberHandler = async (context: LeftChatMemberContext<Bot>) => {
	const leftChatMember = context.leftChatMember;

	if (!leftChatMember) {
		return;
	}

	const user = await db.query.users.findFirst({
		where: eq(users.telegramProfileId, BigInt(leftChatMember.id)),
		with: {
			clashProfile: true,
		},
	});

	if (!user) {
		return;
	}

	await context.reply(
		`${leftChatMember.firstName} (${user.clashProfile?.name}) ha lasciato il gruppo.`,
	);
	return;
};

const pollVoteHandler = async (context: PollContext<Bot>) => {
	const poll = context.payload;

	if (!poll || !context.isClosed()) {
		return;
	}
};

export { chatHandler, newChatMembersHandler, leftChatMemberHandler };
export * from "./conversationState.ts";
