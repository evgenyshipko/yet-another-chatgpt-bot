import {Context, Telegraf} from "telegraf";
import {user} from "../utils/user";
import {Keyboard} from "telegram-keyboard";
import {Command} from "./command";


// TODO: вывести в очередь
export const startHandler = (bot:Telegraf<Context>) => bot.start(async (ctx) => {

    const tgUser = ctx.update.message.from;

    if (tgUser.is_bot){
        return;
    }

    await user.checkSession({
        tgId: tgUser.id,
        nickname: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name
    })

    const keyboard = Keyboard.make([
        Command.BUY,
        Command.PROFILE,
        Command.HELP,
        Command.RESET_CONTEXT,
        // @ts-ignore
    ], {wrap: (row, index, button) => [1, 3].includes(index)})

    ctx.reply('Добро пожаловать! Просто пишите в чат, gpt-ассистент будет вам отвечать 😊', keyboard.reply())
});