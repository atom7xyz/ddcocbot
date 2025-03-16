package xyz.atom7.ddcoc.api

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.Cacheable
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.BodyInserters
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.bodyToMono
import xyz.atom7.ddcoc.api.model.Clan
import xyz.atom7.ddcoc.api.model.GoldPassSeason
import xyz.atom7.ddcoc.api.model.Player
import xyz.atom7.ddcoc.api.model.TokenVerificationResponse

/**
 * Client for interacting with the Clash of Clans API
 */
@Component
class CocApiClient(
    @Value("\${coc.api.url}")
    private val apiUrl: String,
    
    @Value("\${coc.api.token}")
    private val apiToken: String,
    
    private val webClientBuilder: WebClient.Builder
) {
    private val logger = LoggerFactory.getLogger(CocApiClient::class.java)
    private val errorHandler = CocApiErrorHandler()
    
    private val webClient: WebClient by lazy {
        webClientBuilder
            .baseUrl(apiUrl)
            .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer $apiToken")
            .build()
    }
    
    /**
     * Get player information by player tag
     * 
     * @param playerTag The player tag
     * @return The player information
     */
    @Cacheable("players")
    fun getPlayer(playerTag: String): Player?
    {
        val formattedTag = formatTag(playerTag)
        logger.info("Fetching player information for tag: $formattedTag")
        
        return try {
            webClient.get()
                .uri("/players/{playerTag}", formattedTag)
                .retrieve()
                .onStatus({ !it.is2xxSuccessful }, errorHandler::handleError)
                .bodyToMono<Player>()
                .block()
        } catch (e: Exception) {
            if (isNotFound(e)) {
                logger.info("Player with tag $formattedTag not found")
            } else {
                logger.error("Error fetching player information: ${e.message}", e)
            }
            null
        }
    }
    
    /**
     * Get clan information by clan tag
     */
    @Cacheable("clans")
    fun getClan(clanTag: String): Clan? 
    {
        val formattedTag = formatTag(clanTag)
        logger.info("Fetching clan information for tag: $formattedTag")
        
        return try {
            webClient.get()
                .uri("/clans/{clanTag}", formattedTag)
                .retrieve()
                .onStatus({ !it.is2xxSuccessful }, errorHandler::handleError)
                .bodyToMono<Clan>()
                .block()
        } catch (e: Exception) {
            if (isNotFound(e)) {
                logger.info("Clan with tag $formattedTag not found")
            } else {
                logger.error("Error fetching clan information: ${e.message}", e)
            }
            null
        }
    }
    
    /**
     * Verify a player token
     * 
     * @param playerTag The player tag
     * @param token The API token to verify
     * @return true if token is valid, false otherwise
     */
    fun verifyPlayerToken(playerTag: String, token: String): Boolean 
    {
        val formattedTag = formatTag(playerTag)
        logger.info("Verifying token for player: $formattedTag")
        
        return try {
            val response = webClient.post()
                .uri("/players/{playerTag}/verifytoken", formattedTag)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(mapOf("token" to token)))
                .retrieve()
                .onStatus({ !it.is2xxSuccessful }, errorHandler::handleError)
                .bodyToMono<TokenVerificationResponse>()
                .block()
            
            // Return true if status is "ok"
            val result = response?.status?.equals("ok", ignoreCase = true) == true
            logger.info("Token verification result for player $formattedTag: $result")
            result
        } catch (e: Exception) {
            logger.error("Error verifying player token: ${e.message}", e)
            false
        }
    }
    
    /**
     * Format a player or clan tag to ensure it starts with # and is properly URL encoded
     * 
     * @param tag The tag to format
     * @return The formatted tag
     */
    private fun formatTag(tag: String): String
    {
        return if (tag.startsWith("#")) tag else "#$tag"
    }
    
    /**
     * Check if the exception message contains "not found"
     * 
     * @param exception The exception to check
     * @return true if the exception message contains "not found", false otherwise
     */
    private fun isNotFound(exception: Exception): Boolean
    {
        return exception.message?.contains("not found", ignoreCase = true) == true
    }
} 