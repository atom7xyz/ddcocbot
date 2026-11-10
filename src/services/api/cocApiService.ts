import { config } from "../../config.ts";
import { normalizeTag } from "../../lib/tags.ts";
import { TtlCache } from "../../lib/ttlCache.ts";
import { CocApiError, toCocApiError } from "./cocApiErrorHandler.ts";
import type { Clan, Player, TokenVerificationResponse } from "./models/cocModels.ts";

const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;

/** Client for the Clash of Clans API with a short-lived response cache. */
export class CocApiService {
	readonly #baseUrl: string;
	readonly #token: string;
	readonly #players = new TtlCache<Player | null>(CACHE_TTL_MS);
	readonly #clans = new TtlCache<Clan | null>(CACHE_TTL_MS);

	constructor(baseUrl: string, token: string) {
		this.#baseUrl = baseUrl.replace(/\/+$/, "");
		this.#token = token;
	}

	/**
	 * @returns The player, or `null` when the tag does not exist or the API fails.
	 */
	getPlayer(playerTag: string, fresh = false): Promise<Player | null> {
		const tag = normalizeTag(playerTag);
		return this.#players
			.getOrLoad(tag, () => this.#get<Player>(`/players/${encodeURIComponent(tag)}`), fresh)
			.catch((error: unknown) => this.#logAndNull("player", tag, error));
	}

	/**
	 * @returns The clan, or `null` when the tag does not exist or the API fails.
	 */
	getClan(clanTag: string, fresh = false): Promise<Clan | null> {
		const tag = normalizeTag(clanTag);
		return this.#clans
			.getOrLoad(tag, () => this.#get<Clan>(`/clans/${encodeURIComponent(tag)}`), fresh)
			.catch((error: unknown) => this.#logAndNull("clan", tag, error));
	}

	/**
	 * Checks the one-time API token that the player copies from the game settings.
	 * This proves that the Telegram user controls the game account.
	 */
	async verifyPlayerToken(playerTag: string, token: string): Promise<boolean> {
		const tag = normalizeTag(playerTag);

		try {
			const data = await this.#request<TokenVerificationResponse>(`/players/${encodeURIComponent(tag)}/verifytoken`, {
				method: "POST",
				body: JSON.stringify({ token }),
			});
			const ok = data?.status.toLowerCase() === "ok";
			if (ok) {
				this.#players.delete(tag);
			}
			return ok;
		} catch (error) {
			console.error(`Token verification failed for ${tag}:`, error);
			return false;
		}
	}

	#get<T>(path: string): Promise<T | null> {
		return this.#request<T>(path, { method: "GET" });
	}

	/** Performs a request. Resolves `null` on HTTP 404. Throws on other errors. */
	async #request<T>(path: string, init: RequestInit): Promise<T | null> {
		const response = await fetch(`${this.#baseUrl}${path}`, {
			...init,
			headers: {
				Authorization: `Bearer ${this.#token}`,
				Accept: "application/json",
				...(init.body ? { "Content-Type": "application/json" } : {}),
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw await toCocApiError(response);
		}

		return (await response.json()) as T;
	}

	#logAndNull(kind: string, tag: string, error: unknown): null {
		const detail = error instanceof CocApiError ? `HTTP ${error.statusCode}: ${error.message}` : error;
		console.error(`Clash of Clans API: cannot fetch ${kind} ${tag}.`, detail);
		return null;
	}
}

export const cocApiService = new CocApiService(config.COC_API.URL, config.COC_API.TOKEN);
