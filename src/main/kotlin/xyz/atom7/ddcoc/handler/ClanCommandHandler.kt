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
import xyz.atom7.ddcoc.util.TranslationUtils

@HandlerComponent
class ClanCommandHandler @Autowired constructor(
    private val cocApiClient: CocApiClient,
    private val userService: UserService,
    private val messageService: MessageService,
    
    @Value("\${clan}")
    private val defaultClanTag: String,
    
    @Value("\${telegram-bot.username}")
    private val botUsername: String
) : BotHandler({

    command("/clan") {
        val userId = message.from?.id ?: return@command
        val username = message.from?.username
        val args = message.text?.split(" ", limit = 2)
        val clanTag = if (args != null && args.size > 1) args[1] else defaultClanTag
        
        LoggerUtils.logCommandProcessing("/clan", userId, username)
        
        // Check if user is registered
        if (!userService.isUserRegistered(userId)) {
            LoggerUtils.logUserAction(userId, "attempted to use /clan but is not registered")
            
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
        
        LoggerUtils.logApiRequest("clan", clanTag)
        val clan = cocApiClient.getClan(clanTag)
        
        if (clan == null) {
            LoggerUtils.logUserAction(userId, "clan not found", "tag: $clanTag")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.clanNotFound
            )
            return@command
        }
        
        // Format clan information
        LoggerUtils.logUserAction(userId, "formatting clan information", "clan: ${clan.name} (${clan.tag})")
        val clanInfo = messageService.clanInfoTemplate.format(
            clan.name,
            clan.tag,
            clan.clanLevel,
            clan.description ?: "Nessuna descrizione",
            clan.memberList.size,
            TranslationUtils.translateClanType(clan.type),
            TranslationUtils.translateWarFrequency(clan.warFrequency),
            if (clan.isWarLogPublic) "Pubblico" else "Privato",
            clan.warWins,
            clan.warWinStreak,
            clan.warLosses ?: "N/D",
            clan.warTies ?: "N/D",
            clan.clanPoints,
            clan.clanCapitalPoints ?: "N/D"
        )
        
        LoggerUtils.logUserAction(userId, "viewing clan info", "clan: ${clan.name}")
        bot.sendMessage(
            chatId = chatId,
            text = clanInfo,
            parseMode = "Markdown"
        )
    }
    
    command("/members") {
        val userId = message.from?.id ?: return@command
        val username = message.from?.username
        val args = message.text?.split(" ", limit = 2)
        val clanTag = if (args != null && args.size > 1) args[1] else defaultClanTag
        
        LoggerUtils.logCommandProcessing("/members", userId, username)
        
        // Check if user is registered
        if (!userService.isUserRegistered(userId)) {
            LoggerUtils.logUserAction(userId, "attempted to use /members but is not registered")
            
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
        
        LoggerUtils.logApiRequest("clan", clanTag)
        val clan = cocApiClient.getClan(clanTag)
        
        if (clan == null) {
            LoggerUtils.logUserAction(userId, "clan not found", "tag: $clanTag")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.clanNotFound
            )
            return@command
        }
        
        if (clan.memberList.isEmpty()) {
            LoggerUtils.logUserAction(userId, "clan has no members", "clan: ${clan.name}")
            bot.sendMessage(
                chatId = chatId,
                text = messageService.clanNoMembers
            )
            return@command
        }
        
        // Sort members by clan rank
        LoggerUtils.logUserAction(userId, "sorting and formatting members", "clan: ${clan.name}, members: ${clan.memberList.size}")
        val sortedMembers = clan.memberList.sortedBy { it.clanRank }
        
        // Create a formatted list of members
        val header = messageService.clanMembersHeader.format(clan.name, sortedMembers.size)
        
        val membersInfo = StringBuilder(header)
        var messageCount = 1
        
        for (member in sortedMembers) {
            // Format each field with monospace font and consistent indentation
            val formattedMember = String.format(
                "%d. *%s* (%s)\n" +
                "   Livello: %d\n" +
                "   Trofei: %d\n" +
                "   Donazioni: %d / %d\n\n",
                member.clanRank,
                member.name,
                TranslationUtils.translateRole(member.role),
                member.expLevel,
                member.trophies,
                member.donations,
                member.donationsReceived
            )
            
            membersInfo.append(formattedMember)
            
            // Telegram has a 4096 character limit for messages
            // If we're getting close, send the current batch and start a new one
            if (membersInfo.length > 3500) {
                LoggerUtils.logUserAction(userId, "sending members list part $messageCount", "clan: ${clan.name}")
                bot.sendMessage(
                    chatId = chatId,
                    text = membersInfo.toString(),
                    parseMode = "Markdown"
                )

                messageCount++
                membersInfo.clear()
                membersInfo.append(messageService.clanMembersContinued.format(clan.name))
            }
        }
        
        // Send the final message if it's not empty
        if (membersInfo.isNotEmpty()) {
            LoggerUtils.logUserAction(userId, "sending members list final part", "clan: ${clan.name}")
            bot.sendMessage(
                chatId = chatId,
                text = membersInfo.toString(),
                parseMode = "Markdown"
            )
        }
    }
}) 