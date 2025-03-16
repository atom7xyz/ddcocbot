package xyz.atom7.ddcoc.handler

import io.github.dehuckakpyt.telegrambot.annotation.HandlerComponent
import io.github.dehuckakpyt.telegrambot.ext.container.chatId
import io.github.dehuckakpyt.telegrambot.ext.update.message.chatId
import io.github.dehuckakpyt.telegrambot.handler.BotHandler
import io.github.dehuckakpyt.telegrambot.handler.BotUpdateHandler
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import xyz.atom7.ddcoc.service.UserService
import xyz.atom7.ddcoc.util.LoggerUtils

@HandlerComponent
class GroupMembershipHandler @Autowired constructor(
    private val userService: UserService
) : BotUpdateHandler({
    
    // Handle new chat members
    message {
        if (newChatMembers == null || newChatMembers!!.isEmpty()) 
            return@message
        
        val newMember = newChatMembers!!.firstOrNull() ?: return@message
        val memberId = newMember.id
        
        LoggerUtils.logUserAction(memberId, "joined a group", "chatId: $chatId")
        
        // Check if this is our registered user
        val user = userService.getUser(memberId)
        if (user != null && user.isRegistered) {
            LoggerUtils.logUserAction(memberId, "registered user joined group", "cocName: ${user.cocPlayerName}")
            bot.sendMessage(
                chatId = chatId,
                text = "Benvenuto ${newMember.firstName} (${user.cocPlayerName}) nel gruppo del clan!"
            )
        }
    }
    
    // Handle left chat members
    message {
        if (leftChatMember == null) 
            return@message
        
        val leftMember = leftChatMember!!
        val memberId = leftMember.id
        
        LoggerUtils.logUserAction(memberId, "left a group", "chatId: $chatId")
        
        // Check if this is our registered user
        val user = userService.getUser(memberId)
        if (user != null && user.isRegistered) {
            LoggerUtils.logUserAction(memberId, "registered user left group", "cocName: ${user.cocPlayerName}")
            bot.sendMessage(
                chatId = chatId,
                text = "${leftMember.firstName} (${user.cocPlayerName}) ha lasciato il gruppo."
            )
        }
    }
}) 