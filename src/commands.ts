import {getUser, userHasPaidSubscription} from "./utils/user";
import {Context, Telegraf} from "telegraf";
import {clearContext} from "./utils/gpt";
import * as fs from "fs";
import * as path from "path";
import {formatDate} from "./utils/utils";
export enum Commands {
    PROFILE= "👤Профиль",
    HELP = "❔Помощь",
    BUY = "🚀Купить премиум-подписку",
    RESET_CONTEXT = "🧹Сбросить контекст",
}

export enum BotCommands {
    PROFILE= "/profile",
    HELP = "/help",
    BUY = "/buy",
    RESET_CONTEXT = "/reset_context",
}

export const helpHandler = (bot:Telegraf<Context>) => bot.hears([Commands.HELP, BotCommands.HELP], async (ctx) => {
    const text = fs.readFileSync(path.join(__dirname, './help.txt'), 'utf-8');
    ctx.reply(text)
})

export const buyHandler = (bot:Telegraf<Context>) => bot.hears([Commands.BUY, BotCommands.BUY], async (ctx) => {
    ctx.reply('Для приобретения месячной премиум-подписки пишите администратору бота @evgenyship\n' +
        'Стоимость премиум-подписки 500 рублей/мес')
})

export const profileHandler = (bot:Telegraf<Context>) => bot.hears([Commands.PROFILE, BotCommands.PROFILE], async (ctx) => {
    const userId = ctx.update.message.from.id
    console.log('ctx.update.message.from', ctx.update.message.from)
    console.log('userId',userId)
    const userEntity = await getUser(userId)
    console.log('userEntity',userEntity)
    if (!userEntity){
        ctx.reply("Для того, чтобы получить информацию о профиле нужно сначала пообщаться с ботом или нажать /start")
        return
    }

    const {tgId, nickname, freeLimit, subscriptionUntil} = userEntity;
    const hasPaidSubscription = userHasPaidSubscription(userEntity)

    const message = `ID: ${tgId}\nЮзернейм: ${nickname}\nПодписка: ${hasPaidSubscription ? "премиум" : "бесплатная"}
    ${!hasPaidSubscription ? `\nЛимит запросов: ${freeLimit} / 10` : `\nДата окончания подписки :${formatDate(subscriptionUntil)}`}`
    ctx.reply(message, {parse_mode: 'Markdown'})
})

export const clearContextHandler = (bot:Telegraf<Context>) => bot.hears([Commands.RESET_CONTEXT, BotCommands.RESET_CONTEXT], async (ctx) => {
    const chatId = ctx.chat.id;
    clearContext(chatId)
    ctx.reply('Контекст очищен успешно!')
})