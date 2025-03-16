package xyz.atom7.ddcoc.handler

import io.github.dehuckakpyt.telegrambot.annotation.HandlerComponent
import io.github.dehuckakpyt.telegrambot.ext.container.chatId
import io.github.dehuckakpyt.telegrambot.factory.keyboard.inlineKeyboard
import io.github.dehuckakpyt.telegrambot.handler.BotHandler
import io.github.dehuckakpyt.telegrambot.model.telegram.InlineKeyboardButton
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import xyz.atom7.ddcoc.service.MessageService
import xyz.atom7.ddcoc.service.UserService
import xyz.atom7.ddcoc.util.ChatUtils
import xyz.atom7.ddcoc.util.LoggerUtils

@HandlerComponent
class HelpCommandHandler @Autowired constructor(
    private val userService: UserService,
    private val messageService: MessageService,
    
    @Value("\${telegram-bot.username}")
    private val botUsername: String
) : BotHandler({

    command("/help") {
        val telegramId = message.from?.id ?: return@command
        val username = message.from?.username
        
        LoggerUtils.logCommandProcessing("/help", telegramId, username)
        
        val isRegistered = userService.isUserRegistered(telegramId)
        LoggerUtils.logUserRegistrationStatus(telegramId, isRegistered)
        
        val warningText = if (!isRegistered) messageService.helpNotRegisteredWarning else ""
        val helpText = messageService.helpText.format(warningText)
        
        LoggerUtils.logUserAction(telegramId, "sending help message")
        
        if (!isRegistered && !ChatUtils.isChatGroup(message)) {
            val keyboard = inlineKeyboard(
                InlineKeyboardButton(messageService.notRegisteredButton, url = "https://t.me/$botUsername?start=start")
            )
            
            bot.sendMessage(
                chatId = chatId,
                text = helpText,
                parseMode = "Markdown",
                replyMarkup = keyboard
            )
        } else {
            bot.sendMessage(
                chatId = chatId,
                text = helpText,
                parseMode = "Markdown"
            )
        }
    }
}) 