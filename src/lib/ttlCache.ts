interface Entry<V> {
	value: Promise<V>;
	expiresAt: number;
}

/**
 * Minimal async TTL cache.
 *
 * Concurrent lookups for the same key share one in-flight promise. A rejected
 * promise is evicted immediately so that failures are never cached.
 */
export class TtlCache<V> {
	readonly #entries = new Map<string, Entry<V>>();
	readonly #ttlMs: number;
	readonly #now: () => number;

	constructor(ttlMs: number, now: () => number = Date.now) {
		this.#ttlMs = ttlMs;
		this.#now = now;
	}

	get size(): number {
		return this.#entries.size;
	}

	/**
	 * Returns the cached value for `key`, or calls `load` and caches its result.
	 *
	 * @param fresh - Skip the cached value and force a new `load`.
	 */
	getOrLoad(key: string, load: () => Promise<V>, fresh = false): Promise<V> {
		const now = this.#now();
		const entry = this.#entries.get(key);

		if (!fresh && entry && entry.expiresAt > now) {
			return entry.value;
		}

		this.#prune(now);

		const value = load();
		this.#entries.set(key, { value, expiresAt: now + this.#ttlMs });
		value.catch(() => {
			if (this.#entries.get(key)?.value === value) {
				this.#entries.delete(key);
			}
		});

		return value;
	}

	delete(key: string): void {
		this.#entries.delete(key);
	}

	clear(): void {
		this.#entries.clear();
	}

	#prune(now: number): void {
		for (const [key, entry] of this.#entries) {
			if (entry.expiresAt <= now) {
				this.#entries.delete(key);
			}
		}
	}
}
