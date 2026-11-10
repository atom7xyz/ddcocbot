import type { Bot, ContextType } from "gramio";

export type MessageCtx = ContextType<Bot, "message">;
export type CommandCtx = MessageCtx & { args: string | null };
/** Callback handlers registered with `bot.callbackQuery(string, ...)` get no `data`. */
export type CallbackCtx = Omit<ContextType<Bot, "callback_query">, "data">;
export type NewMembersCtx = ContextType<Bot, "new_chat_members">;
export type LeftMemberCtx = ContextType<Bot, "left_chat_member">;
