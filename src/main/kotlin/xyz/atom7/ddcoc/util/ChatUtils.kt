package xyz.atom7.ddcoc.util

import io.github.dehuckakpyt.telegrambot.model.telegram.Message

object ChatUtils
{
    fun isChatGroup(message: Message): Boolean
    {
        return message.chat.type != "private"
    }
}