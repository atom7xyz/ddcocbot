package xyz.atom7.ddcoc.handler

import io.github.dehuckakpyt.telegrambot.annotation.HandlerComponent
import io.github.dehuckakpyt.telegrambot.ext.container.chatId
import io.github.dehuckakpyt.telegrambot.handler.BotHandler
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import xyz.atom7.ddcoc.service.MessageService
import xyz.atom7.ddcoc.service.UserService
import xyz.atom7.ddcoc.util.ChatUtils
import xyz.atom7.ddcoc.util.LoggerUtils

@HandlerComponent
class AdminCommandHandler @Autowired constructor(
    private val userService: UserService,
    private val messageService: MessageService,
) : BotHandler({

    command("/refresh") {
        val telegramId = message.from?.id ?: return@command
        val username = message.from?.username
        
        LoggerUtils.logCommandProcessing("/refresh", telegramId, username)
        
        if (!ChatUtils.isChatGroup(message)) {
            LoggerUtils.logUserAction(telegramId, "tried to use /refresh in private chat")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.commandGroupOnly
            )
            return@command
        }
        
        // Check if user is an admin (Leader or Co-Leader)
        val isAdmin = userService.isUserAdmin(telegramId)
        LoggerUtils.logUserAction(telegramId, "admin status check", "isAdmin: $isAdmin")
        
        if (!isAdmin) {
            LoggerUtils.logUserAction(telegramId, "not authorized to use /refresh")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.notAuthorized
            )
            return@command
        }
        
        LoggerUtils.logUserAction(telegramId, "starting clan member refresh")
        bot.sendMessage(
            chatId = chatId,
            text = messageService.refreshStarted
        )
        
        val users = userService.getAllUsers()
        LoggerUtils.logUserAction(telegramId, "checking users for clan membership", "users: ${users.size}")
        
        var notInClanCount = 0
        
        // Check if each user is still in the clan
        users.forEach { user ->
            if (user.cocPlayerTag != null) {
                val isInClan = userService.isPlayerInClan(user.cocPlayerTag!!)
                
                if (!isInClan) {
                    notInClanCount++
                    LoggerUtils.logUserAction(telegramId, "user not in clan",
                        "user: ${user.telegramId}, player: ${user.cocPlayerName}")
                    
                    // Send a message to the group
                    bot.sendMessage(
                        chatId = chatId,
                        text = messageService.userNotInClan.format(
                            user.cocPlayerName ?: "Unknown",
                            user.username ?: user.telegramId.toString()
                        )
                    )
                }
            }
        }
        
        LoggerUtils.logUserAction(telegramId, "refresh completed", "notInClanCount: $notInClanCount")
        bot.sendMessage(
            chatId = chatId,
            text = messageService.refreshCompleted.format(notInClanCount)
        )
    }
    
    command("/kick") {
        val telegramId = message.from?.id ?: return@command
        val username = message.from?.username
        
        LoggerUtils.logCommandProcessing("/kick", telegramId, username)
        
        if (!ChatUtils.isChatGroup(message)) {
            LoggerUtils.logUserAction(telegramId, "tried to use /kick in private chat")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.commandGroupOnly
            )
            return@command
        }
        
        // Check if user is an admin (Leader or Co-Leader)
        val isAdmin = userService.isUserAdmin(telegramId)
        LoggerUtils.logUserAction(telegramId, "admin status check", "isAdmin: $isAdmin")
        
        if (!isAdmin) {
            LoggerUtils.logUserAction(telegramId, "not authorized to use /kick")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.notAuthorized
            )
            return@command
        }
        
        val args = message.text?.split(" ", limit = 2)
        
        if (args == null || args.size < 2) {
            LoggerUtils.logUserAction(telegramId, "provided invalid arguments for /kick")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.kickUsage
            )
            return@command
        }
        
        val targetUsername = args[1].trim()
        LoggerUtils.logUserAction(telegramId, "attempting to kick user", "target: $targetUsername")
        
        var user = userService.findUserByCocPlayerName(targetUsername)
        
        // If not found by CoC name, try to find by Telegram username
        if (user == null) {
            LoggerUtils.logUserAction(telegramId, "user with CoC name not found, trying Telegram username", "target: $targetUsername")
            // Get all users and find one with matching Telegram username
            val allUsers = userService.getAllUsers()
            user = allUsers.find { it.username == targetUsername || it.username == "@$targetUsername" }
        }
        
        if (user == null) {
            LoggerUtils.logUserAction(telegramId, "target user not found", "target: $targetUsername")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.userNotFound
            )
            return@command
        }

        val existingUser = user!!
        LoggerUtils.logUserAction(telegramId, "kicking user", "user: ${existingUser.telegramId}, name: ${existingUser.cocPlayerName}")
        
        // Attempt to kick the user from the group
        try {
            bot.banChatMember(
                chatId = chatId,
                userId = existingUser.telegramId
            )
            
            LoggerUtils.logUserAction(telegramId, "successfully kicked user", "user: ${existingUser.telegramId}")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.userKicked.format(
                    existingUser.cocPlayerName ?: existingUser.username ?: existingUser.telegramId.toString()
                )
            )
        } catch (e: Exception) {
            LoggerUtils.logError("Failed to kick user ${existingUser.telegramId}", e)
            bot.sendMessage(
                chatId = chatId,
                text = messageService.kickFailed
            )
        }
    }
    
    command("/users") {
        val telegramId = message.from?.id ?: return@command
        val username = message.from?.username
        
        LoggerUtils.logCommandProcessing("/users", telegramId, username)
        
        // Check if user is an admin (Leader or Co-Leader)
        val isAdmin = userService.isUserAdmin(telegramId)
        LoggerUtils.logUserAction(telegramId, "admin status check", "isAdmin: $isAdmin")
        
        if (!isAdmin) {
            LoggerUtils.logUserAction(telegramId, "not authorized to use /users")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.notAuthorized
            )
            return@command
        }
        
        // Get all registered users
        val users = userService.getAllUsers()
        LoggerUtils.logUserAction(telegramId, "retrieved registered users", "count: ${users.size}")
        
        if (users.isEmpty()) {
            LoggerUtils.logUserAction(telegramId, "no registered users found")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.noRegisteredUsers
            )
            return@command
        }
        
        val usersList = StringBuilder(messageService.usersHeader)
        var messageCount = 1
        
        // Add each user to the list
        users.forEach { user ->
            val userInfo = messageService.userListItem.format(
                user.username ?: "No username",
                user.telegramId,
                user.cocPlayerTag ?: "N/A",
                user.cocPlayerName ?: "N/A"
            )
            
            // Check if adding this user would exceed Telegram's message limit
            if (usersList.length + userInfo.length > 4000) {
                // Send the current message
                LoggerUtils.logUserAction(telegramId, "sending users list part $messageCount")
                bot.sendMessage(
                    chatId = chatId,
                    text = usersList.toString(),
                    parseMode = "Markdown"
                )
                
                // Start a new message
                messageCount++
                usersList.clear()
                usersList.append(messageService.usersHeader)
            }
            
            usersList.append(userInfo)
        }
        
        // Send the final message if it's not empty
        if (usersList.isNotEmpty()) {
            LoggerUtils.logUserAction(telegramId, "sending users list final part")
            bot.sendMessage(
                chatId = chatId,
                text = usersList.toString(),
                parseMode = "Markdown"
            )
        }
    }
}) 