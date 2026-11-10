/** Error raised for a non-2xx response from the Clash of Clans API. */
export class CocApiError extends Error {
	override readonly name = "CocApiError";
	readonly statusCode: number;
	readonly response: unknown;

	constructor(message: string, statusCode: number, response: unknown) {
		super(message);
		this.statusCode = statusCode;
		this.response = response;
	}
}

const STATUS_MESSAGES: Record<number, string> = {
	400: "Bad request",
	403: "Authentication failed. Check the API token and its allowed IP addresses",
	404: "The requested resource was not found",
	429: "Too many requests. Try again later",
	500: "The Clash of Clans API had an internal error",
	503: "The Clash of Clans API is under maintenance",
};

/** Builds a {@link CocApiError} from a failed response. */
export async function toCocApiError(response: Response): Promise<CocApiError> {
	let body: unknown;
	try {
		body = await response.json();
	} catch {
		body = { message: response.statusText };
	}

	const apiMessage =
		typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
			? body.message
			: undefined;

	const message =
		STATUS_MESSAGES[response.status] ?? apiMessage ?? `Clash of Clans API error (HTTP ${response.status})`;

	return new CocApiError(message, response.status, body);
}
