import { CocApiService } from "./cocApiService";
import { CocApiError, CocApiErrorHandler } from "./cocApiErrorHandler";

// Export a singleton of the CocApiService instance
export const cocApiService = new CocApiService();

export { CocApiService, CocApiError, CocApiErrorHandler };
export * from "./models/cocModels";
