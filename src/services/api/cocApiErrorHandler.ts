/**
 * Custom error class for Clash of Clans API errors
 * Extends the native Error class with additional API-specific properties
 */
export class CocApiError extends Error {
	/**
	 * Creates a new CocApiError instance
	 * @param message The error message
	 * @param statusCode The HTTP status code from the API response
	 * @param response The raw response data from the API
	 */
	constructor(
		message: string,
		public statusCode?: number,
		public response?: unknown,
	) {
		super(message);
		this.name = "CocApiError";
	}
}

/**
 * Error handler class for managing Clash of Clans API errors
 * Provides methods to handle and process API error responses
 */
export class CocApiErrorHandler {
	/**
	 * Handles HTTP errors from the Clash of Clans API
	 * @param response The error response object from the fetch call
	 * @param status The HTTP status code from the response
	 * @throws {CocApiError} Always throws a CocApiError with the processed error information
	 */
	public async handleError(response: Response, status: number): Promise<never> {
		let errorData: unknown;

		// Attempt to parse the error response as JSON
		try {
			errorData = await response.json();
		} catch (e) {
			// Fallback to using the status text if JSON parsing fails
			errorData = { message: response.statusText };
		}

		// Get a user-friendly error message and throw a CocApiError
		const errorMessage = this.getErrorMessage(status, errorData);
		throw new CocApiError(errorMessage, status, errorData);
	}

	/**
	 * Generates a user-friendly error message based on the status code and error data
	 * @param status The HTTP status code from the response
	 * @param errorData The parsed error data from the response
	 * @returns A human-readable error message
	 */
	private getErrorMessage(status: number, errorData: unknown): string {
		// Default error message if no specific case matches
		const defaultMessage =
			"An error occurred while communicating with the Clash of Clans API";

		// Handle specific status codes with appropriate messages
		if (status === 404) {
			return "The requested resource was not found";
		}

		if (status === 403 || status === 401) {
			return "Authentication failed. Please check your API token";
		}

		if (status === 429) {
			return "Too many requests. Please try again later";
		}

		if (status === 500 || status === 503) {
			return "The Clash of Clans API is currently unavailable. Please try again later";
		}

		// If the error data contains a message string, use that
		if (
			typeof errorData === "object" &&
			errorData !== null &&
			"message" in errorData &&
			typeof errorData.message === "string"
		) {
			return errorData.message;
		}

		// Fallback to the default message
		return defaultMessage;
	}
}
