package xyz.atom7.ddcoc.handler

import io.github.dehuckakpyt.telegrambot.annotation.HandlerComponent
import io.github.dehuckakpyt.telegrambot.ext.container.chatId
import io.github.dehuckakpyt.telegrambot.factory.keyboard.inlineKeyboard
import io.github.dehuckakpyt.telegrambot.handler.BotHandler
import io.github.dehuckakpyt.telegrambot.model.telegram.InlineKeyboardButton
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import xyz.atom7.ddcoc.api.CocApiClient
import xyz.atom7.ddcoc.service.MessageService
import xyz.atom7.ddcoc.service.UserService
import xyz.atom7.ddcoc.util.LoggerUtils

@HandlerComponent
class PlayerCommandHandler @Autowired constructor(
    private val cocApiClient: CocApiClient,
    private val userService: UserService,
    private val messageService: MessageService,
    
    @Value("\${telegram-bot.username}")
    private val botUsername: String
) : BotHandler({
    
    command("/me") {
        val userId = message.from?.id ?: return@command
        val username = message.from?.username
        
        LoggerUtils.logCommandProcessing("/me", userId, username)
        
        // Check if user is registered
        if (!userService.isUserRegistered(userId)) {
            LoggerUtils.logUserAction(userId, "attempted to use /me but is not registered")
            
            // Create registration button that redirects to private chat
            val keyboard = inlineKeyboard(
                InlineKeyboardButton(messageService.notRegisteredButton, url = "https://t.me/$botUsername?start=start")
            )
            
            bot.sendMessage(
                chatId = chatId,
                text = messageService.notRegistered,
                replyMarkup = keyboard
            )
            return@command
        }
        
        val user = userService.getUser(userId)
        
        if (user == null) {
            LoggerUtils.logWarning("User $userId is registered but not found in database")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.notRegistered
            )
            return@command
        }
        
        if (user.cocPlayerTag == null || user.cocPlayerName == null) {
            LoggerUtils.logWarning("User $userId has incomplete information")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.incompleteUserInfo
            )
            return@command
        }
        
        LoggerUtils.logApiRequest("player", user.cocPlayerTag!!)
        val player = cocApiClient.getPlayer(user.cocPlayerTag!!)
        
        if (player == null) {
            LoggerUtils.logWarning("Could not retrieve player info for user $userId")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.playerInfoError
            )
            return@command
        }
        
        // Format record information if available
        val recordInfo = if (player.bestTrophies > 0) " (Record: `${player.bestTrophies}`)" else ""
        
        // Format player information using the template
        val playerInfo = messageService.playerInfoTemplate.format(
            player.name,
            player.tag,
            player.townHallLevel,
            player.expLevel,
            player.trophies,
            recordInfo,
            player.clan?.name ?: "Non in un clan"
        )
        
        LoggerUtils.logUserAction(userId, "viewing player info")
        bot.sendMessage(
            chatId = chatId,
            text = playerInfo,
            parseMode = "Markdown"
        )
    }
    
    command("/player") {
        val userId = message.from?.id ?: return@command
        val username = message.from?.username
        val args = message.text?.split(" ", limit = 2)
        
        LoggerUtils.logCommandProcessing("/player", userId, username)
        
        // Check if user is registered
        if (!userService.isUserRegistered(userId)) {
            LoggerUtils.logUserAction(userId, "attempted to use /player but is not registered")
            
            // Create registration button that redirects to private chat
            val keyboard = inlineKeyboard(
                InlineKeyboardButton(messageService.notRegisteredButton, url = "https://t.me/$botUsername?start=start")
            )
            
            bot.sendMessage(
                chatId = chatId,
                text = messageService.notRegistered,
                replyMarkup = keyboard
            )
            return@command
        }
        
        if (args == null || args.size < 2) {
            LoggerUtils.logUserAction(userId, "missing player tag in /player command")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.playerTagRequired
            )
            return@command
        }
        
        val playerTag = args[1]
        LoggerUtils.logApiRequest("player", playerTag)
        val player = cocApiClient.getPlayer(playerTag)
        
        if (player == null) {
            LoggerUtils.logUserAction(userId, "player not found", "tag: $playerTag")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.playerNotFound.format(playerTag)
            )
            return@command
        }
        
        // Format record information if available
        val recordInfo = if (player.bestTrophies > 0) " (Record: `${player.bestTrophies}`)" else ""
        
        // Format player information
        val playerInfo = messageService.playerInfoTemplate.format(
            player.name,
            player.tag,
            player.townHallLevel,
            player.expLevel,
            player.trophies,
            recordInfo,
            player.clan?.name ?: "Non in un clan"
        )
        
        LoggerUtils.logUserAction(userId, "viewing player info", "tag: ${player.tag}")
        bot.sendMessage(
            chatId = chatId,
            text = playerInfo,
            parseMode = "Markdown"
        )
    }
}) 