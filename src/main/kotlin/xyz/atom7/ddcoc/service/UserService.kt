package xyz.atom7.ddcoc.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import xyz.atom7.ddcoc.api.CocApiClient
import xyz.atom7.ddcoc.model.User
import xyz.atom7.ddcoc.repository.UserRepository

@Service
class UserService(
    private val userRepository: UserRepository,
    private val cocApiClient: CocApiClient,
    
    @Value("\${clan}")
    private val clanTag: String
) {
    /**
     * Check if a user is registered
     * 
     * @param telegramId The user ID
     * @return true if the user is registered, false otherwise
     */
    @Cacheable("userRegistrationStatus")
    fun isUserRegistered(telegramId: Long): Boolean 
    {
        val user = userRepository.findByTelegramId(telegramId)
        return user?.isRegistered == true
    }
    
    /**
     * Register a new user or update an existing one with initial information
     * 
     * @param telegramId The user ID
     * @param username The username
     * @param firstName The first name
     * @param lastName The last name
     * @return The user
     */
    @CacheEvict(value = ["userRegistrationStatus", "users"], key = "#telegramId")
    fun initializeUser(telegramId: Long, username: String?, firstName: String?, lastName: String?): User 
    {
        val existingUser = userRepository.findByTelegramId(telegramId)
        
        return existingUser?.apply {
            this.username = username
            this.firstName = firstName
            this.lastName = lastName
        }?.also { userRepository.save(it) }
            ?: userRepository.save(
                User(
                    telegramId = telegramId,
                    username = username,
                    firstName = firstName,
                    lastName = lastName
                )
            )
    }
    
    /**
     * Save a user to the database
     * 
     * @param user The user to save
     * @return The saved user
     */
    @CacheEvict(value = ["userRegistrationStatus", "users"], key = "#user.telegramId")
    fun saveUser(user: User): User 
    {
        return userRepository.save(user)
    }
    
    /**
     * Check if a player is in the clan and complete registration if true
     * 
     * @param telegramId The user ID
     * @param playerName The player name
     * @return The registration result
     */
    fun verifyAndRegisterPlayer(telegramId: Long, playerName: String): RegistrationResult 
    {
        // Check if input is a player tag (starts with #)
        if (playerName.startsWith("#")) {
            return verifyAndRegisterPlayerByTag(telegramId, playerName)
        }
        
        // Retrieve the clan information
        val clan = cocApiClient.getClan(clanTag) ?: return RegistrationResult.ClanNotFound
        
        // Check if the player is in the clan
        val member = clan.memberList.find { it.name.equals(playerName, ignoreCase = true) }
            ?: return RegistrationResult.PlayerNotInClan
        
        // Update the user with player information
        val user = userRepository.findByTelegramId(telegramId) ?: return RegistrationResult.UserNotFound
        
        user.apply {
            cocPlayerName = member.name
            cocPlayerTag = member.tag
            isRegistered = false
        }

        saveUser(user)
        return RegistrationResult.Success
    }
    
    /**
     * Check if a player with specific tag is in the clan and complete registration
     * 
     * @param telegramId The user ID
     * @param playerTag The player tag
     * @return The registration result
     */
    fun verifyAndRegisterPlayerByTag(telegramId: Long, playerTag: String): RegistrationResult 
    {
        // Fetch the player information first
        val player = cocApiClient.getPlayer(playerTag) ?: return RegistrationResult.PlayerNotFound
        
        // Retrieve the clan information
        val clan = cocApiClient.getClan(clanTag) ?: return RegistrationResult.ClanNotFound
        
        // Check if the player is in our clan
        val isInClan = player.clan?.tag?.equals(clan.tag, ignoreCase = true) ?: false
        if (!isInClan) {
            return RegistrationResult.PlayerNotInClan
        }
        
        // Update the user with player information
        val user = userRepository.findByTelegramId(telegramId) ?: return RegistrationResult.UserNotFound
        
        user.apply {
            cocPlayerName = player.name
            cocPlayerTag = player.tag
            isRegistered = false
        }

        saveUser(user)
        return RegistrationResult.Success
    }
    
    /**
     * Verify player with API token using the CoC API
     * 
     * @param telegramId The user ID
     * @param playerTag The player tag
     * @param apiToken The API token
     * @return The registration result
     */
    fun verifyPlayerWithToken(telegramId: Long, playerTag: String, apiToken: String): RegistrationResult 
    {
        if (apiToken.isBlank()) {
            return RegistrationResult.InvalidToken
        }
        
        // Verify the token with the CoC API
        val isTokenValid = cocApiClient.verifyPlayerToken(playerTag, apiToken)
        if (!isTokenValid) {
            return RegistrationResult.InvalidToken
        }
        
        // Update the user with player information
        val user = userRepository.findByTelegramId(telegramId) ?: return RegistrationResult.UserNotFound
        
        user.apply {
            cocApiToken = apiToken
            isRegistered = true
        }

        saveUser(user)
        return RegistrationResult.Success
    }
    
    /**
     * Check if a user is a Leader or Co-Leader in the clan
     * 
     * @param telegramId The user ID
     * @return true if the user is a Leader or Co-Leader, false otherwise
     */
    fun isUserAdmin(telegramId: Long): Boolean 
    {
        val user = userRepository.findByTelegramId(telegramId) ?: return false
        if (!user.isRegistered || user.cocPlayerTag == null)
            return false
        
        val clan = cocApiClient.getClan(clanTag) ?: return false
        val member = clan.memberList.find { it.tag == user.cocPlayerTag } ?: return false
        
        return member.role.equals("leader", ignoreCase = true) || 
               member.role.equals("coleader", ignoreCase = true)
    }
    
    /**
     * Get all registered users
     * 
     * @return The list of registered users
     */
    fun getAllUsers(): List<User> 
    {
        return userRepository.findByIsRegisteredTrue()
    }
    
    /**
     * Check if a player is still in the clan
     * 
     * @param playerTag The player tag
     * @return true if the player is in the clan, false otherwise
     */
    fun isPlayerInClan(playerTag: String): Boolean 
    {
        val clan = cocApiClient.getClan(clanTag) ?: return false
        return clan.memberList.any { it.tag == playerTag }
    }
    
    /**
     * Find user by CoC player name
     * 
     * @param playerName The player name
     * @return The user
     */
    fun findUserByCocPlayerName(playerName: String): User? 
    {
        return userRepository.findByCocPlayerNameIgnoreCase(playerName)
    }

    /**
     * Find user by CoC player tag
     * 
     * @param tag The player tag
     * @return The user
     */
    fun findUserByCocTagName(tag: String): User? 
    {
        return userRepository.findByCocPlayerTag(tag)
    }
    
    /**
     * Get user by Telegram ID
     * 
     * @param telegramId The user ID
     * @return The user
     */
    @Cacheable("users")
    fun getUser(telegramId: Long): User? 
    {
        return userRepository.findByTelegramId(telegramId)
    }
}

/**
 * Enum representing the different results of a registration process
 */
enum class RegistrationResult 
{
    Success,
    UserNotFound,
    ClanNotFound,
    PlayerNotInClan,
    InvalidToken,
    PlayerNotFound
} 