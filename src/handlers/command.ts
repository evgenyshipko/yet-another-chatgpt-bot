import {getUser, userHasPaidSubscription} from "../utils/user";
import {gpt} from "../utils/gpt";
import * as fs from "fs";
import * as path from "path";
import {formatDate} from "../utils/utils";
import {CommandsQueueData} from "../queues";
import {ParseMode, telegramApi} from "../utils/telegramApi";
import {throttlingStorage} from "../utils/redisStorage";
import {log} from "../utils/logs";

export enum Command {
    PROFILE= "👤Профиль",
    HELP = "❔Помощь",
    BUY = "🚀Купить премиум-подписку",
    RESET_CONTEXT = "🧹Сбросить контекст",
}

export const new_line = "%0A";

export enum BotCommands {
    PROFILE= "/profile",
    HELP = "/help",
    BUY = "/buy",
    RESET_CONTEXT = "/reset_context",
    START = "/start"
}

export const helpHandler = async (data: CommandsQueueData) => {
    const time1 = performance.now()
    // асинхронно считываем файл чтоб не блокировать поток
    fs.readFile(path.join(__dirname, '../../public/help.txt'), 'utf-8', (err, text) => {
            const time2 = performance.now()
            log.info(`read file from disc: ${time2-time1}`)
            telegramApi.sendMessage(data.chatId, text)
        }
    );
}

export const buyHandler = async (data: CommandsQueueData) => {
    const text = 'Для приобретения месячной премиум-подписки пишите администратору бота @evgenyship' +
        '\nСтоимость премиум-подписки 500 рублей/мес'
    await telegramApi.sendMessage(data.chatId, text, ParseMode.MARKDOWN)
}

export const profileHandler = async (data: CommandsQueueData) => {
    const userEntity = await getUser(data.user.id)
    if (!userEntity){
        const text = "Для того, чтобы получить информацию о профиле нужно сначала пообщаться с ботом или нажать /start"
        await telegramApi.sendMessage(data.chatId, text, ParseMode.MARKDOWN)
        return
    }

    const {tgId, nickname, freeLimit, subscriptionUntil} = userEntity;
    const hasPaidSubscription = userHasPaidSubscription(userEntity)

    const message = `ID: ${tgId} \nЮзернейм: ${nickname} \nПодписка: ${hasPaidSubscription ? "премиум" : "бесплатная"}
    ${!hasPaidSubscription ? `\nЛимит запросов: ${freeLimit} / 10` : `\nДата окончания подписки :${formatDate(subscriptionUntil)}`}`
    await telegramApi.sendMessage(data.chatId, message, ParseMode.MARKDOWN)
}

export const resetContextHandler = async (data: CommandsQueueData) => {
    await gpt.clearContext(data.chatId)
    await throttlingStorage.drop({chatId: data.chatId, userId: data.user.id})
    await telegramApi.sendMessage(data.chatId,'Контекст очищен успешно!')
}