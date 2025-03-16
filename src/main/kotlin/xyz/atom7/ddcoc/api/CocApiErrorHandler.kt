package xyz.atom7.ddcoc.api

import org.slf4j.LoggerFactory
import org.springframework.web.reactive.function.client.ClientResponse
import reactor.core.publisher.Mono
import org.springframework.http.HttpStatus
import org.springframework.web.reactive.function.client.WebClientResponseException

/**
 * Error handler for COC API client responses
 */
class CocApiErrorHandler 
{
    private val logger = LoggerFactory.getLogger(CocApiErrorHandler::class.java)
    
    /**
     * Handle error responses from the COC API
     * 
     * @param response The client response
     * @return A Mono that emits a Throwable if the response is an error, or an empty Mono if the response is successful
     */
    fun handleError(response: ClientResponse): Mono<Throwable> 
    {
        val status = response.statusCode()
        val uri = response.request().uri.toString()
        
        return when {
            status == HttpStatus.NOT_FOUND -> {
                // Check if this is a player or clan lookup
                if (uri.contains("/players/") || uri.contains("/clans/")) {
                    logger.info("Resource not found: $uri")
                } else {
                    logger.warn("Resource not found: $uri")
                }
                
                Mono.error(WebClientResponseException.create(
                    status.value(),
                    "Resource not found",
                    response.headers().asHttpHeaders(),
                    ByteArray(0),
                    null
                ))
            }
            status == HttpStatus.FORBIDDEN -> {
                logger.error("Authentication error (403) accessing COC API. Check your API token.")
                Mono.error(WebClientResponseException.create(
                    status.value(),
                    "Authentication error - check your API token",
                    response.headers().asHttpHeaders(),
                    ByteArray(0),
                    null
                ))
            }
            status == HttpStatus.TOO_MANY_REQUESTS -> {
                logger.warn("Rate limit exceeded (429) for COC API")
                Mono.error(WebClientResponseException.create(
                    status.value(),
                    "Rate limit exceeded",
                    response.headers().asHttpHeaders(),
                    ByteArray(0),
                    null
                ))
            }
            status.is5xxServerError -> {
                logger.error("Server error ${status.value()} from COC API")
                Mono.error(WebClientResponseException.create(
                    status.value(),
                    "Server error",
                    response.headers().asHttpHeaders(),
                    ByteArray(0),
                    null
                ))
            }
            !status.is2xxSuccessful -> {
                logger.error("Unexpected error ${status.value()} from COC API for $uri")
                response.bodyToMono(String::class.java)
                    .flatMap { body ->
                        logger.error("Error response body: $body")
                        Mono.error(WebClientResponseException.create(
                            status.value(),
                            "Unexpected error",
                            response.headers().asHttpHeaders(),
                            body.toByteArray(),
                            null
                        ))
                    }
            }
            else -> Mono.error(IllegalStateException("Unexpected success status code in error handler"))
        }
    }
} 