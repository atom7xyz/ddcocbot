/**
 * In-memory state for the private-chat registration flow.
 *
 * State is lost on restart. That is acceptable: the user runs /start again.
 */

const CONVERSATION_TTL_MS = 30 * 60 * 1000;

export type Conversation = { step: "waiting_tag" } | { step: "waiting_api_token"; tag: string };

interface StoredConversation {
	conversation: Conversation;
	expiresAt: number;
}

const conversations = new Map<number, StoredConversation>();

export function getConversation(userId: number): Conversation | undefined {
	const stored = conversations.get(userId);
	if (!stored) {
		return undefined;
	}
	if (stored.expiresAt <= Date.now()) {
		conversations.delete(userId);
		return undefined;
	}
	return stored.conversation;
}

export function setConversation(userId: number, conversation: Conversation): void {
	const now = Date.now();
	for (const [id, stored] of conversations) {
		if (stored.expiresAt <= now) {
			conversations.delete(id);
		}
	}
	conversations.set(userId, { conversation, expiresAt: now + CONVERSATION_TTL_MS });
}

export function clearConversation(userId: number): void {
	conversations.delete(userId);
}
