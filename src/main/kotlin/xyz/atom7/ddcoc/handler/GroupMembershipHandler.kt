package xyz.atom7.ddcoc.handler

import io.github.dehuckakpyt.telegrambot.annotation.HandlerComponent
import io.github.dehuckakpyt.telegrambot.ext.container.chatId
import io.github.dehuckakpyt.telegrambot.ext.update.message.chatId
import io.github.dehuckakpyt.telegrambot.handler.BotUpdateHandler
import io.github.dehuckakpyt.telegrambot.model.telegram.User
import org.springframework.beans.factory.annotation.Autowired
import xyz.atom7.ddcoc.service.UserService
import xyz.atom7.ddcoc.util.LoggerUtils

@HandlerComponent
class GroupMembershipHandler @Autowired constructor(
    private val userService: UserService
) : BotUpdateHandler({

    /**
     * Handle member actions (join/leave) with logging and messaging
     *
     * @param member The chat member
     * @param action The action being performed ("joined" or "left")
     * @param messageTemplate Function to generate the message text
     */
    suspend fun handleMemberAction(
        member: User,
        chatId: Long,
        action: String,
        messageTemplate: (String, String) -> String
    ) {
        val memberId = member.id
        val memberName = member.firstName

        LoggerUtils.logUserAction(memberId, "$action a group", "chatId: $chatId")

        val user = userService.getUser(memberId)
        if (user == null || !user.isRegistered) {
            LoggerUtils.logUserAction(memberId, "user was not registered", "chatId: $chatId")
            return
        }

        LoggerUtils.logUserAction(memberId, "registered user $action group", "cocName: ${user.cocPlayerName}")
        bot.sendMessage(
            chatId = chatId,
            text = messageTemplate(memberName, user.cocPlayerName ?: "Unknown")
        )
    }

    // Handler joins/leaves from the groups
    message {
        newChatMembers?.forEach { member ->
            handleMemberAction(member, chatId, "joined") { name, cocName ->
                "Benvenuto $name ($cocName) nel gruppo del clan!"
            }
        }

        leftChatMember?.let { member ->
            handleMemberAction(member, chatId, "left") { name, cocName ->
                "$name ($cocName) ha lasciato il gruppo."
            }
        }
    }
})