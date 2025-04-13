/**
 * Enum representing the possible states of a conversation with a user.
 *
 * WAITING_TAG - The bot is waiting for the user to provide their Clash of Clans tag
 * WAITING_API_TOKEN - The bot is waiting for the user to provide their API token
 */
enum ConversationState {
	WAITING_TAG = "waiting_tag",
	WAITING_API_TOKEN = "waiting_api_token",
}

/**
 * Interface representing a conversation with a user
 *
 * @property tag - The Clash of Clans tag associated with the conversation (if provided)
 * @property state - The current state of the conversation
 */
interface Conversation {
	tag: string | undefined;
	state: ConversationState;
}

/**
 * Map storing active conversations with users
 *
 * Key: User ID (number)
 * Value: Conversation object
 */
const conversations = new Map<bigint, Conversation>();

/**
 * Gets the conversation state for a user.
 *
 * @param userId - The ID of the user to get the conversation for
 * @returns The conversation object if it exists, undefined otherwise
 */
const getConversation = (userId: bigint) => {
	return conversations.get(userId);
};

/**
 * Sets the conversation state for a user.
 *
 * @param userId - The ID of the user to set the conversation for
 * @param tag - The Clash of Clans tag to associate with the conversation
 * @param state - The new state to set for the conversation
 */
const setConversation = (
	userId: bigint,
	tag: string | undefined,
	state: ConversationState,
) => {
	conversations.set(userId, { tag, state });
	console.log(`Setting conversation for user ${userId}:`, { tag, state });
};

/**
 * Clears the conversation state for a user.
 *
 * @param userId - The ID of the user to clear the conversation for
 */
const clearConversation = (userId: bigint) => {
	conversations.delete(userId);
};

export {
	getConversation,
	setConversation,
	clearConversation,
	ConversationState,
};
