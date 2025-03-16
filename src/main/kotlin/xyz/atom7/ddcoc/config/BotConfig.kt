package xyz.atom7.ddcoc.config

import io.github.dehuckakpyt.telegrambot.annotation.EnableTelegramBot
import io.github.dehuckakpyt.telegrambot.config.TelegramBotConfig
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.ExchangeStrategies
import org.springframework.web.reactive.function.client.WebClient

@EnableTelegramBot
@Configuration
class BotConfig 
{

    @Bean
    fun telegramBotConfig(): TelegramBotConfig = TelegramBotConfig().apply {
        
    }
    
    @Bean
    fun webClientBuilder(): WebClient.Builder 
    {
        val strategies = ExchangeStrategies.builder()
            .codecs { codecs ->
                codecs
                    .defaultCodecs()
                    .maxInMemorySize(WEB_CLIENT_MEMSIZE)
            }
            .build()
            
        return WebClient.builder()
            .exchangeStrategies(strategies)
    }

    companion object {
        const val WEB_CLIENT_MEMSIZE = 8 * 1024 * 1024
    }
}