import {Context, Telegraf} from "telegraf";
import {message} from "telegraf/filters";
import {checkUserCanMakeQuery, createUserIfNotExist, decreaseFreeLimit} from "./utils/user";
import {askGpt} from "./utils/gpt";

export const messageHandler = (bot:Telegraf<Context>) => bot.on(message('text'), async (ctx) => {
    const tgUser = ctx.update.message.from

    if (tgUser.is_bot){
        return;
    }

    await createUserIfNotExist({
        tgId: tgUser.id,
        nickname: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name
    })

    const isSendingEnabled = await checkUserCanMakeQuery(tgUser.id)

    if (!isSendingEnabled){
        ctx.reply('К сожалению у вас закончился пробный период 😢\n' +
            'Для приобретения месячной подписки пишите администратору бота @evgenyship')
        return;
    }

    const message = await ctx.reply('Выполняется обработка запроса, ждите! 😊')

    const text = ctx.update.message.text

    const chatId = ctx.update.message.chat.id

    const {text: result} = await askGpt(chatId, text);

    ctx.reply(result, {parse_mode: 'Markdown'});

    ctx.deleteMessage(message.message_id)

    await decreaseFreeLimit(tgUser.id)

})