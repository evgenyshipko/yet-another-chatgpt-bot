import {Context, Telegraf} from "telegraf";
import {BotCommands, Command} from "./command";
import {getCommandsQueue} from "../queues";
import {logInfo} from "../utils/logs";

export const commandHandler = (bot:Telegraf<Context>) =>
    bot.hears([...Object.values(BotCommands), ...Object.values(Command)], async (ctx) => {

        const chatId = ctx.message.chat.id;
        const userMessage = ctx.message.text;

        const tgUser = ctx.update.message.from
        if (tgUser.is_bot){
            return;
        }

        const queue = getCommandsQueue();

        queue.add({
            chatId,
            command: userMessage as BotCommands | Command,
            user: {
                id: tgUser.id,
                nickname: tgUser.username,
                firstName: tgUser.first_name,
                lastName: tgUser.last_name
            }
        }).then(() => logInfo(`Message from user_id: ${tgUser.id}, chat_id: ${chatId} added to command queue`))
})