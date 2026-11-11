import { formatWithOptions } from "node:util";

const REDACTED = "[REDACTED]";

/** Telegram bot tokens look like `123456789:AA...` (35 characters after the colon). */
const TELEGRAM_TOKEN_PATTERN = /\d{6,}:[A-Za-z0-9_-]{30,}/g;

/** Secrets shorter than this are not replaced, so short values cannot corrupt ordinary text. */
const MIN_SECRET_LENGTH = 8;

export type Redactor = (text: string) => string;

/**
 * Returns a function that replaces every known secret, and anything shaped
 * like a Telegram bot token, with "[REDACTED]".
 */
export function createRedactor(secrets: readonly (string | null | undefined)[]): Redactor {
	const literals = [...new Set(secrets)]
		.filter((secret): secret is string => !!secret && secret.length >= MIN_SECRET_LENGTH)
		// Replace longer secrets first, in case one secret contains another.
		.sort((a, b) => b.length - a.length);

	return (text) => {
		let result = text;
		for (const secret of literals) {
			result = result.replaceAll(secret, REDACTED);
		}
		return result.replace(TELEGRAM_TOKEN_PATTERN, REDACTED);
	};
}

const CONSOLE_METHODS = ["debug", "log", "info", "warn", "error", "trace"] as const;

/**
 * Routes every console method through the redactor. This also covers log
 * lines from dependencies, such as GramIO printing a failed request URL that
 * contains the bot token.
 */
export function redactConsole(redact: Redactor): void {
	for (const method of CONSOLE_METHODS) {
		const original = console[method].bind(console);
		console[method] = (...args: unknown[]) => {
			original(redact(formatWithOptions({ colors: false, depth: 6 }, ...args)));
		};
	}
}
