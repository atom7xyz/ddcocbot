package xyz.atom7.ddcoc.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import xyz.atom7.ddcoc.model.User

@Repository
interface UserRepository : JpaRepository<User, Long> 
{
    fun findByTelegramId(telegramId: Long): User?
    fun existsByTelegramId(telegramId: Long): Boolean
    fun findByIsRegisteredTrue(): List<User>
    fun findByCocPlayerNameIgnoreCase(cocPlayerName: String): User?
    fun findByCocPlayerTag(cocPlayerTag: String): User?
} 