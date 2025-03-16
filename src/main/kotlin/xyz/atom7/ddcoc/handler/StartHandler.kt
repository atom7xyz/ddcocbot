package xyz.atom7.ddcoc.handler

import io.github.dehuckakpyt.telegrambot.annotation.HandlerComponent
import io.github.dehuckakpyt.telegrambot.ext.container.chatId
import io.github.dehuckakpyt.telegrambot.factory.keyboard.inlineKeyboard
import io.github.dehuckakpyt.telegrambot.handler.BotHandler
import io.github.dehuckakpyt.telegrambot.model.telegram.InlineKeyboardButton
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import xyz.atom7.ddcoc.service.MessageService
import xyz.atom7.ddcoc.service.RegistrationResult
import xyz.atom7.ddcoc.service.UserService
import xyz.atom7.ddcoc.util.ChatUtils
import xyz.atom7.ddcoc.util.LoggerUtils

@HandlerComponent
class StartHandler @Autowired constructor(
    private val userService: UserService,
    private val conversationStateManager: ConversationStateManager,
    private val messageService: MessageService,
    
    @Value("\${group.link}")
    private val groupLink: String,
    
    @Value("\${telegram-bot.username}")
    private val botUsername: String
) : BotHandler({
    
    command("/start", next = "registration_process") {
        val telegramId = message.from?.id ?: return@command
        val username = message.from?.username
        val firstName = message.from?.firstName
        val lastName = message.from?.lastName
        
        LoggerUtils.logCommandProcessing("/start", telegramId, username)
        
        if (!ChatUtils.isChatGroup(message)) {
            LoggerUtils.logUserAction(telegramId, "attempted to use /start in a group chat", "chatId: ${message.chat.id}")
            
            val keyboard = inlineKeyboard(
                InlineKeyboardButton(messageService.privateChatButton, url = "https://t.me/$botUsername?start=start")
            )
            
            bot.sendMessage(
                chatId = chatId,
                text = messageService.groupChatError,
                replyMarkup = keyboard
            )
            return@command
        }
        
        userService.initializeUser(telegramId, username, firstName, lastName)
        
        if (userService.isUserRegistered(telegramId)) {
            LoggerUtils.logUserAction(telegramId, "already registered")
            val user = userService.getUser(telegramId)
            bot.sendMessage(
                chatId = chatId,
                text = messageService.welcomeBack.format(user?.cocPlayerName ?: firstName)
            )
            
            // Show available commands
            bot.sendMessage(
                chatId = chatId,
                text = messageService.useHelpCommand
            )
        } else {
            LoggerUtils.logUserAction(telegramId, "starting registration process")
            // Create inline buttons for registration methods
            val keyboard = inlineKeyboard(
                callbackButton(messageService.registerByNameButton, "register_by_name"),
                callbackButton(messageService.registerByIdButton, "register_by_tag")
            )
            
            bot.sendMessage(
                chatId = chatId,
                text = messageService.registrationWelcome,
                replyMarkup = keyboard
            )
            
            conversationStateManager.setState(telegramId, ConversationState.NONE)
        }
    }
    
    callback("register_by_name") {
        val telegramId = query.from.id
        LoggerUtils.logUserAction(telegramId, "selected 'Register by name' method")
        
        bot.sendMessage(
            chatId = query.message?.chat?.id ?: return@callback,
            text = messageService.provideCocUsernameName
        )
        bot.answerCallbackQuery(callbackQueryId = query.id)
        
        conversationStateManager.setState(telegramId, ConversationState.AWAITING_PLAYER_NAME)

        next("registration_process")
    }

    callback("register_by_tag") {
        val telegramId = query.from.id
        LoggerUtils.logUserAction(telegramId, "selected 'Register by TAG' method")
        
        // Send the prompt for player tag
        bot.sendMessage(
            chatId = query.message?.chat?.id ?: return@callback,
            text = messageService.provideCocUsernameTag
        )
        bot.answerCallbackQuery(callbackQueryId = query.id)
        
        conversationStateManager.setState(telegramId, ConversationState.AWAITING_PLAYER_TAG)

        next("registration_process")
    }

    // Handler for text messages (for registration)
    step("registration_process") {
        val telegramId = message.from?.id ?: return@step
        val text = message.text ?: return@step

        when (conversationStateManager.getState(telegramId)) {
            ConversationState.AWAITING_PLAYER_NAME, ConversationState.AWAITING_PLAYER_TAG -> {
                val state = conversationStateManager.getState(telegramId)
                val isNameRegistration = state == ConversationState.AWAITING_PLAYER_NAME
                
                // Process player input (name or tag)
                var playerInput = text
                
                // For tag registration, ensure it starts with #
                if (!isNameRegistration && !playerInput.startsWith("#")) {
                    playerInput = "#$playerInput"
                    LoggerUtils.logUserAction(telegramId, "added # to player tag", "tag: $playerInput")
                }
                
                val logType = if (isNameRegistration) "name" else "tag"
                LoggerUtils.logUserAction(telegramId, "processing player $logType input", "input: '$playerInput'")
                LoggerUtils.logUserAction(telegramId, "verifying player $logType", "$logType: '$playerInput'")
                
                // Call the appropriate verification method based on registration type
                val result = if (isNameRegistration) {
                    userService.verifyAndRegisterPlayer(telegramId, playerInput)
                } else {
                    userService.verifyAndRegisterPlayerByTag(telegramId, playerInput)
                }
                
                LoggerUtils.logUserAction(telegramId, "verification result", "result: $result")
                
                when (result) {
                    RegistrationResult.PlayerNotInClan -> {
                        LoggerUtils.logUserAction(telegramId, "player not found in clan", "$logType: '$playerInput'")
                        val message = if (isNameRegistration) {
                            messageService.playerNotFoundInClan.format(playerInput)
                        } else {
                            messageService.playerNotInClanByTag.format(playerInput)
                        }
                        bot.sendMessage(chatId = chatId, text = message)
                    }
                    RegistrationResult.ClanNotFound -> {
                        LoggerUtils.logWarning("Clan not found while processing player $logType for user $telegramId")
                        bot.sendMessage(
                            chatId = chatId,
                            text = messageService.clanInfoError
                        )
                    }
                    RegistrationResult.UserNotFound -> {
                        LoggerUtils.logWarning("User $telegramId not found in database while processing player $logType")
                        bot.sendMessage(
                            chatId = chatId,
                            text = messageService.userInfoError
                        )
                    }
                    RegistrationResult.PlayerNotFound -> {
                        LoggerUtils.logUserAction(telegramId, "player not found", "$logType: '$playerInput'")
                        val message = if (isNameRegistration) {
                            messageService.playerNotFound.format(playerInput)
                        } else {
                            messageService.playerNotFoundByTag.format(playerInput)
                        }
                        bot.sendMessage(chatId = chatId, text = message)
                    }
                    RegistrationResult.Success -> {
                        LoggerUtils.logUserAction(telegramId, "player successfully verified", "$logType: '$playerInput'")
                        // Player found in the clan, now ask for API token to verify identity
                        bot.sendMessage(
                            chatId = chatId,
                            text = messageService.provideApiToken
                        )
                        
                        LoggerUtils.logUserAction(telegramId, "sending API token instructions")

                        // Update conversation state to wait for API token
                        conversationStateManager.setState(telegramId, ConversationState.AWAITING_API_TOKEN)
                        next("send_api_token")
                        return@step
                    }
                    else -> {
                        LoggerUtils.logWarning("Unexpected result '$result' while processing player $logType for user $telegramId")
                        // Unexpected result
                        bot.sendMessage(
                            chatId = chatId,
                            text = messageService.unexpectedError
                        )
                        conversationStateManager.clear(telegramId)
                        return@step
                    }
                }
                next("registration_process")
            }
            else -> {
                if (userService.isUserRegistered(telegramId)) {
                    return@step
                }
                
                LoggerUtils.logUserAction(telegramId, "received message in NONE state while not registered")
                bot.sendMessage(
                    chatId = chatId,
                    text = messageService.notRegistered
                )
            }
        }
    }
    
    // Handler for API token verification
    step("send_api_token") {
        val telegramId = message.from?.id ?: return@step
        val apiToken = message.text ?: return@step
        
        LoggerUtils.logUserAction(telegramId, "processing API token")
        
        // Get the user to retrieve the player tag
        val user = userService.getUser(telegramId)
        if (user?.cocPlayerTag == null) {
            LoggerUtils.logWarning("User $telegramId or player tag not found during API token verification")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.userInfoError
            )
            conversationStateManager.clear(telegramId)
            return@step
        }
        
        // Verify the token with the API
        LoggerUtils.logUserAction(telegramId, "verifying API token with player tag", "tag: ${user.cocPlayerTag}")
        val verificationResult = userService.verifyPlayerWithToken(telegramId, user.cocPlayerTag!!, apiToken)
        LoggerUtils.logUserAction(telegramId, "token verification result", "result: $verificationResult")
        
        when (verificationResult) {
            RegistrationResult.Success -> {
                LoggerUtils.logUserAction(telegramId, "registration completed successfully")
                
                // Send success message with heart emoji
                bot.sendMessage(
                    chatId = chatId,
                    text = messageService.registrationSuccessHeart
                )
                
                // Send completion message
                bot.sendMessage(
                    chatId = chatId,
                    text = messageService.registrationComplete
                )

                // Invite to join the group
                LoggerUtils.logUserAction(telegramId, "inviting to join group")
                bot.sendMessage(
                    chatId = chatId,
                    text = messageService.joinGroup.format(groupLink)
                )

                // Send help message
                bot.sendMessage(
                    chatId = chatId,
                    text = messageService.useHelpCommand
                )

                // Clear conversation state
                conversationStateManager.clear(telegramId)
            }
            RegistrationResult.InvalidToken -> {
                LoggerUtils.logUserAction(telegramId, "invalid API token provided")
                bot.sendMessage(
                    chatId = chatId,
                    text = messageService.invalidApiToken
                )
                // Keep state as AWAITING_API_TOKEN to allow retry
                next("send_api_token")
            }
            else -> {
                LoggerUtils.logWarning("Unexpected verification result '$verificationResult' for user $telegramId")
                // Other errors
                bot.sendMessage(
                    chatId = chatId,
                    text = messageService.verificationError
                )
                conversationStateManager.clear(telegramId)
            }
        }
    }
})
