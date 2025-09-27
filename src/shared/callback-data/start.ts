import { format, italic, MediaUpload, type Bot } from "gramio";
import type { CallbackQueryShorthandContext } from "gramio";
import { setConversation } from "services/convo/conversationState";
import { ConversationState } from "services/convo/conversationState";
import { tagKeyboard } from "shared/keyboards";

/**
 * Handles the start callback query from the user.
 *
 * This function:
 * 1. Acknowledges the callback query with a thumbs up emoji
 * 2. Sets the chat action to "typing"
 * 3. Sets the conversation state to WAITING_TAG
 * 4. Sends a message asking for the user's Clash of Clans tag
 *
 * @param context - The callback query context containing user and message data
 */
const callbackStart = async (
  context: CallbackQueryShorthandContext<Bot, "start">,
) => {
  await context.answerCallbackQuery({
    text: "👍",
    show_alert: false,
  });

  await context.sendChatAction("typing");

  await context.send(
    "Per prima cosa, servirebbe che mi indicassi il tuo TAG, lo puoi trovare nel tuo profilo di Clash of Clans (esempio: #2P0R98UYJ).",
    {
      reply_markup: {
        inline_keyboard: tagKeyboard,
      },
    },
  );

  // Set conversation state to wait for user's Clash tag
  setConversation(
    BigInt(context.from.id),
    undefined,
    ConversationState.WAITING_TAG,
  );
};

/**
 * Handles the tag explanation callback query from the user.
 *
 * This function:
 * 1. Acknowledges the callback query with a thumbs up emoji
 * 2. Sets the chat action to "upload_photo"
 * 3. Sends a photo showing where to find the Clash of Clans tag
 *
 * @param context - The callback query context containing user and message data
 */
const callbackTag = async (
  context: CallbackQueryShorthandContext<Bot, "howto_tag">,
) => {
  await context.answerCallbackQuery({
    text: "👍",
    show_alert: false,
  });

  await context.sendChatAction("upload_photo");

  await context.sendPhoto(
    await MediaUpload.url("https://atom7.xyz/share/u/P3qCUwVA.png"),
    {
      caption:
        "Puoi trovare il tuo TAG nel tuo profilo di Clash of Clans, ad esempio: #2P0R98UYJ",
    },
  );
};

/**
 * Handles the API token explanation callback query from the user.
 *
 * This function:
 * 1. Acknowledges the callback query with a thumbs up emoji
 * 2. Sets the chat action to "upload_photo"
 * 3. Sends two photos showing how to find and copy the API token
 *
 * @param context - The callback query context containing user and message data
 */
const callbackApiToken = async (
  context: CallbackQueryShorthandContext<Bot, "howto_api_token">,
) => {
  await context.answerCallbackQuery({
    text: "👍",
    show_alert: false,
  });

  await context.sendChatAction("upload_photo");

  await context.sendPhoto(
    await MediaUpload.url("https://atom7.xyz/share/u/KNJKkhqu.png"),
    {
      caption: format`Puoi trovare il tuo API Token nella sezione ${italic`Impostazioni`} e poi ${italic`Altre impostazioni`} di Clash of Clans.`,
    },
  );

  await context.sendPhoto(
    await MediaUpload.url("https://atom7.xyz/share/u/O2Zd1jjJ.png"),
    {
      caption: format`Cliccando il bottone ${italic`Mostra`} e poi ${italic`Copia`} potrai ottenere il tuo API Token.`,
    },
  );
};

export { callbackStart, callbackTag, callbackApiToken };
