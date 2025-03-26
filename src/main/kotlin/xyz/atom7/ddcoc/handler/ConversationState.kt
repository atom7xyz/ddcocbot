package xyz.atom7.ddcoc.handler

import org.springframework.stereotype.Component
import xyz.atom7.ddcoc.util.LoggerUtils
import java.util.concurrent.ConcurrentHashMap

/**
 * Simple in-memory state manager for maintaining conversation state
 */
@Component
class ConversationStateManager 
{
    private val stateMap = ConcurrentHashMap<Long, ConversationState>()
    
    /**
     * Get the conversation state for a given user
     * 
     * @param userId The user ID
     * @return The conversation state
     */
    fun getState(userId: Long): ConversationState 
    {
        val state = stateMap.getOrDefault(userId, ConversationState.NONE)
        LoggerUtils.logUserAction(userId, "getting conversation state", "state: $state")
        return state
    }
    
    /**
     * Set the conversation state for a given user
     * 
     * @param userId The user ID
     * @param state The conversation state
     */
    fun setState(userId: Long, state: ConversationState) 
    {
        LoggerUtils.logUserAction(userId, "setting conversation state", "state: $state")
        stateMap[userId] = state
    }
    
    /**
     * Clear the conversation state for a given user
     * 
     * @param userId The user ID
     */
    fun clear(userId: Long) 
    {
        LoggerUtils.logUserAction(userId, "clearing conversation state")
        stateMap.remove(userId)
    }
    
    /**
     * Check if a user is in registration process
     * 
     * @param userId The user ID
     * @return True if user is in registration process, false otherwise
     */
    fun isUserInRegistrationProcess(userId: Long): Boolean
    {
        val state = getState(userId)
        return state == ConversationState.AWAITING_PLAYER_NAME ||
               state == ConversationState.AWAITING_PLAYER_TAG ||
               state == ConversationState.AWAITING_API_TOKEN
    }
}

/**
 * Enum representing the different states of a conversation
 */
enum class ConversationState 
{
    NONE,
    AWAITING_PLAYER_NAME,
    AWAITING_PLAYER_TAG,
    AWAITING_API_TOKEN
} 