/**
 * Splits a command argument string on any whitespace.
 *
 * GramIO passes the text after the command as `context.args`. It is `null`
 * when the command has no arguments.
 */
export function splitArgs(args: string | null | undefined): string[] {
	if (!args) {
		return [];
	}
	return args.trim().split(/\s+/).filter(Boolean);
}
