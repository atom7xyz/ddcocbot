import { CocApiService } from "./cocApiService";
import { CocApiError, CocApiErrorHandler } from "./cocApiErrorHandler";
import { TelegramApiService } from "./telegramApiService";

// Export a singleton of the CocApiService instance
export const cocApiService = new CocApiService();
export const telegramApiService = new TelegramApiService();

export { CocApiService, CocApiError, CocApiErrorHandler };
export * from "./models/cocModels";
