import { getTelegramUserId } from "commands/index.ts";
import { apiTokenSent } from "commands/start";
import { tagSent } from "commands/start";
import type { Bot, MessageContext } from "gramio";
import {
	ConversationState,
	getConversation,
	setConversation,
} from "services/convo/conversationState";

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
const chatHandler = async (context: MessageContext<Bot>) => {
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
		await tagSent(message, context);
		return;
	}

	if (conversation.state === ConversationState.WAITING_API_TOKEN) {
		// Process message as API token
		await apiTokenSent(message, context);
		return;
	}
};

// Export the chat handler function and all conversation state utilities
export { chatHandler };
export * from "./conversationState.ts";
