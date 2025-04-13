import { Cacheables } from "cacheables";
import type { Bot } from "gramio";

export class TelegramApiService {
	// The bot instance
	private bot: Bot | null = null;
	// Cache instance for storing API responses
	private cache: Cacheables;
	// Default cache time-to-live (5 minutes)
	private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

	constructor() {
		// Initialize cache with logging enabled
		this.cache = new Cacheables({
			logTiming: true,
			log: true,
		});
	}

	setBot(bot: Bot) {
		this.bot = bot;
	}

	async getChatMember(chatId: number, userId: number, skipCache = false) {
		if (!this.bot) {
			throw new Error("Bot not set");
		}

		const cacheKey = Cacheables.key("chatMember", chatId, userId);

		// Skip cache if requested
		if (skipCache && this.cache.isCached(cacheKey)) {
			this.cache.delete(cacheKey);
		}

		try {
			return await this.cache.cacheable(
				async () => {
					console.log(
						`Fetching fresh chat member data for chat: ${chatId}, user: ${userId}`,
					);

					const result = await this.bot?.api.getChatMember({
						chat_id: chatId,
						user_id: Number(userId),
					});

					return result;
				},
				cacheKey,
				{
					cachePolicy: "max-age",
					maxAge: this.DEFAULT_TTL,
				},
			);
		} catch (e) {
			console.error(
				`Error fetching chat member data for chat: ${chatId}, user: ${userId}`,
			);
			return null;
		}
	}
}
