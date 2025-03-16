package xyz.atom7.ddcoc.config

import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.caffeine.CaffeineCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.TimeUnit
import kotlin.time.Duration

@Configuration
@EnableCaching
class CacheConfig 
{
    @Bean
    fun cacheManager(): CacheManager 
    {
        val cacheManager = CaffeineCacheManager()
        cacheManager.setCaffeine(
            Caffeine.newBuilder()
                .expireAfterWrite(CACHE_DURATION, CACHE_DURATION_TIMEUNIT)
                .maximumSize(CACHE_MAX_SIZE)
        )
        return cacheManager
    }

    companion object {
        const val CACHE_DURATION: Long = 10
        val CACHE_DURATION_TIMEUNIT = TimeUnit.MINUTES
        const val CACHE_MAX_SIZE: Long = 100
    }
} 