import {Context, Telegraf} from "telegraf";
import {message} from "telegraf/filters";
import {getMessageQueue} from "../queues";
import {logInfo} from "../utils/logs";
import {throttlingStorage} from "../utils/redisStorage";

export const messageHandler = (bot:Telegraf<Context>) => bot.on(message("text"), (ctx) => {
    const chatId = ctx.message.chat.id;
    const userMessage = ctx.message.text;

    const tgUser = ctx.update.message.from
    if (tgUser.is_bot){
        return;
    }

    const queue = getMessageQueue();

    queue.add({
        chatId,
        message: userMessage,
        user: {
            id: tgUser.id,
            nickname: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name
        }
    }).then(() => logInfo(`Message from user_id: ${tgUser.id}, chat_id: ${chatId} added to message queue, message: ${userMessage}`)
    )
});