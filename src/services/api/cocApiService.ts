import { config } from "../../config";
import { CocApiErrorHandler } from "./cocApiErrorHandler";
import type {
	Player,
	Clan,
	TokenVerificationResponse,
} from "./models/cocModels";
import { Cacheables } from "cacheables";

/**
 * Service class for interacting with the Clash of Clans API
 * Handles API requests, caching, and error handling
 */
export class CocApiService {
	// API base URL from config
	private readonly apiUrl: string;
	// API authentication token from config
	private readonly apiToken: string;
	// Error handler instance for API errors
	private readonly errorHandler: CocApiErrorHandler;

	// Cache instance for storing API responses
	private cache: Cacheables;
	// Default cache time-to-live (5 minutes)
	private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

	/**
	 * Constructs a new CocApiService instance
	 * Initializes API configuration and cache
	 */
	constructor() {
		this.apiUrl = config.COC_API.URL;
		this.apiToken = config.COC_API.TOKEN;
		this.errorHandler = new CocApiErrorHandler();

		// Initialize cache with logging enabled
		this.cache = new Cacheables({
			logTiming: true,
			log: true,
		});
	}

	/**
	 * Get player information by player tag
	 *
	 * @param playerTag The player tag
	 * @param skipCache Optional: Skip cache and force a fresh API request
	 * @returns The player information or null if not found
	 */
	async getPlayer(
		playerTag: string,
		skipCache = false,
	): Promise<Player | null> {
		const formattedTag = this.formatTag(playerTag);
		console.log(`Fetching player information for tag: ${formattedTag}`);

		// Generate a cache key for the player
		const cacheKey = Cacheables.key("player", formattedTag);

		// Skip cache if requested
		if (skipCache && this.cache.isCached(cacheKey)) {
			this.cache.delete(cacheKey);
		}

		try {
			return await this.cache.cacheable(
				async () => {
					console.log(`Fetching fresh player data for tag: ${formattedTag}`);

					const response = await fetch(
						`${this.apiUrl}/players/${encodeURIComponent(formattedTag)}`,
						{
							headers: {
								Authorization: `Bearer ${this.apiToken}`,
								Accept: "application/json",
							},
						},
					);

					if (!response.ok) {
						if (response.status === 404) {
							console.log(`Player with tag ${formattedTag} not found`);
							return null;
						}

						return await this.errorHandler.handleError(
							response,
							response.status,
						);
					}

					return (await response.json()) as Player;
				},
				cacheKey,
				{
					cachePolicy: "max-age",
					maxAge: this.DEFAULT_TTL,
				},
			);
		} catch (e) {
			if (this.isNotFound(e)) {
				console.log(`Player with tag ${formattedTag} not found`);
			} else {
				console.error(
					`Error fetching player information: ${(e as Error).message}`,
					e,
				);
			}
			return null;
		}
	}

	/**
	 * Get clan information by clan tag
	 *
	 * @param clanTag The clan tag
	 * @param skipCache Optional: Skip cache and force a fresh API request
	 * @returns The clan information or null if not found
	 */
	async getClan(clanTag: string, skipCache = false): Promise<Clan | null> {
		const formattedTag = this.formatTag(clanTag);
		console.log(`Fetching clan information for tag: ${formattedTag}`);

		// Generate a cache key for the clan
		const cacheKey = Cacheables.key("clan", formattedTag);

		// Skip cache if requested
		if (skipCache && this.cache.isCached(cacheKey)) {
			this.cache.delete(cacheKey);
		}

		try {
			return await this.cache.cacheable(
				async () => {
					console.log(`Fetching fresh clan data for tag: ${formattedTag}`);

					const response = await fetch(
						`${this.apiUrl}/clans/${encodeURIComponent(formattedTag)}`,
						{
							headers: {
								Authorization: `Bearer ${this.apiToken}`,
								Accept: "application/json",
							},
						},
					);

					if (!response.ok) {
						if (response.status === 404) {
							console.log(`Clan with tag ${formattedTag} not found`);
							return null;
						}

						return await this.errorHandler.handleError(
							response,
							response.status,
						);
					}

					return (await response.json()) as Clan;
				},
				cacheKey,
				{
					cachePolicy: "max-age",
					maxAge: this.DEFAULT_TTL,
				},
			);
		} catch (e) {
			if (this.isNotFound(e)) {
				console.log(`Clan with tag ${formattedTag} not found`);
			} else {
				console.error(
					`Error fetching clan information: ${(e as Error).message}`,
					e,
				);
			}
			return null;
		}
	}

	/**
	 * Verify a player token
	 *
	 * @param playerTag The player tag
	 * @param token The token to verify
	 * @returns true if the token is valid, false otherwise
	 */
	async verifyPlayerToken(playerTag: string, token: string): Promise<boolean> {
		const formattedTag = this.formatTag(playerTag);
		console.log(`Verifying token for player: ${formattedTag}`);

		try {
			const response = await fetch(
				`${this.apiUrl}/players/${encodeURIComponent(formattedTag)}/verifytoken`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.apiToken}`,
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify({ token }),
				},
			);

			if (!response.ok) {
				await this.errorHandler.handleError(response, response.status);
				return false;
			}

			const data = (await response.json()) as TokenVerificationResponse;
			const result = data.status.toLowerCase() === "ok";

			console.log(
				`Token verification result for player ${formattedTag}: ${result}`,
			);

			// If verification was successful, invalidate the player's cache to ensure fresh data next time
			if (result) {
				this.invalidatePlayerCache(formattedTag);
			}

			return result;
		} catch (e) {
			console.error(`Error verifying player token: ${(e as Error).message}`, e);
			return false;
		}
	}

	/**
	 * Invalidate a player's cache
	 *
	 * @param playerTag The player tag
	 */
	invalidatePlayerCache(playerTag: string): void {
		const formattedTag = this.formatTag(playerTag);
		const cacheKey = Cacheables.key("player", formattedTag);

		if (this.cache.isCached(cacheKey)) {
			this.cache.delete(cacheKey);
			console.log(`Invalidated cache for player: ${formattedTag}`);
		}
	}

	/**
	 * Invalidate a clan's cache
	 *
	 * @param clanTag The clan tag
	 */
	invalidateClanCache(clanTag: string): void {
		const formattedTag = this.formatTag(clanTag);
		const cacheKey = Cacheables.key("clan", formattedTag);

		if (this.cache.isCached(cacheKey)) {
			this.cache.delete(cacheKey);
			console.log(`Invalidated cache for clan: ${formattedTag}`);
		}
	}

	/**
	 * Format a player or clan tag to ensure it starts with #
	 *
	 * @param tag The tag to format
	 * @returns The formatted tag
	 */
	private formatTag(tag: string): string {
		return tag.startsWith("#") ? tag : `#${tag}`;
	}

	/**
	 * Check if the exception message contains "not found"
	 *
	 * @param exception The exception to check
	 * @returns true if the exception message contains "not found", false otherwise
	 */
	private isNotFound(exception: unknown): boolean {
		return (
			exception instanceof Error &&
			typeof exception.message === "string" &&
			exception.message.toLowerCase().includes("not found")
		);
	}

	/**
	 * Clear all caches
	 */
	clearCaches() {
		this.cache.clear();
		console.log("Cache cleared");
	}

	/**
	 * Get all cache keys
	 *
	 * @returns An array of all cache keys
	 */
	getCacheKeys(): string[] {
		return this.cache.keys();
	}
}
