package xyz.atom7.ddcoc.util

import org.slf4j.Logger
import org.slf4j.LoggerFactory

/**
 * Utility class for standardized logging throughout the application
 */
object LoggerUtils 
{
    private val logger = LoggerFactory.getLogger(LoggerUtils::class.java)

    /**
     * Log command processing
     *
     * @param command The command being processed
     * @param telegramId The Telegram ID of the user
     * @param username The username of the user (optional)
     */
    fun logCommandProcessing(command: String, telegramId: Long, username: String? = null) 
    {
        val usernameInfo = if (username != null) " (username: $username)" else ""
        logger.info("Processing $command command for user: $telegramId$usernameInfo")
    }

    /**
     * Log user registration status
     *
     * @param telegramId The Telegram ID of the user
     * @param isRegistered Whether the user is registered
     */
    fun logUserRegistrationStatus(telegramId: Long, isRegistered: Boolean) 
    {
        val status = if (isRegistered) "registered" else "not registered"
        logger.info("User $telegramId is $status")
    }

    /**
     * Log API request
     *
     * @param endpoint The API endpoint being called
     * @param parameter The parameter being used (e.g., player tag, clan tag)
     */
    fun logApiRequest(endpoint: String, parameter: String) 
    {
        logger.info("Calling $endpoint API with parameter: $parameter")
    }

    /**
     * Log user action
     *
     * @param telegramId The Telegram ID of the user
     * @param action The action being performed
     * @param details Additional details about the action
     */
    fun logUserAction(telegramId: Long, action: String, details: String? = null) 
    {
        val detailsInfo = if (details != null) " - $details" else ""
        logger.info("User $telegramId performing action: $action$detailsInfo")
    }

    /**
     * Log error
     *
     * @param message The error message
     * @param exception The exception (optional)
     */
    fun logError(message: String, exception: Exception? = null) 
    {
        if (exception != null) {
            logger.error("$message: ${exception.message}", exception)
            return
        }

        logger.error(message)
    }

    /**
     * Log warning
     *
     * @param message The warning message
     */
    fun logWarning(message: String) 
    {
        logger.warn(message)
    }

    /**
     * Get a logger for a specific class
     *
     * @param clazz The class to get the logger for
     * @return The logger
     */
    fun getLogger(clazz: Class<*>): Logger 
    {
        return LoggerFactory.getLogger(clazz)
    }
} 