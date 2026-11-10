/**
 * Clash of Clans tags only use this alphabet. Players often type the letter
 * "O" instead of the digit "0", so normalization fixes that before validation.
 */
const TAG_ALPHABET = "0289PYLQGRJCUV";
const TAG_PATTERN = new RegExp(`^#[${TAG_ALPHABET}]{3,14}$`);

/**
 * Normalizes user input into the canonical tag form used by the API:
 * trimmed, upper-case, prefixed with "#", and with "O" mapped to "0".
 */
export function normalizeTag(input: string): string {
	const cleaned = input.trim().toUpperCase().replace(/O/g, "0").replace(/\s/g, "");
	return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
}

/** Returns true when the tag is already normalized and uses the valid alphabet. */
export function isValidTag(tag: string): boolean {
	return TAG_PATTERN.test(tag);
}

/**
 * Normalizes and validates in one step.
 *
 * @returns The canonical tag, or `null` when the input cannot be a tag.
 */
export function parseTag(input: string | null | undefined): string | null {
	if (!input) {
		return null;
	}
	const tag = normalizeTag(input);
	return isValidTag(tag) ? tag : null;
}
