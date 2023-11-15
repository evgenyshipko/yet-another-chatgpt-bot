import {getUser, userHasPaidSubscription} from "../utils/user";
import {clearContext} from "../utils/gpt";
import * as fs from "fs";
import * as path from "path";
import {formatDate} from "../utils/utils";
import {CommandsQueueData} from "../queues";
import {ParseMode, sendMessageToTg} from "../utils/telegram";
import {throttlingStorage} from "../utils/redisStorage";

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
    // TODO: считывать из кеша, чтоб не руинить скорость
    const text = fs.readFileSync(path.join(__dirname, '../../public/help.txt'), 'utf-8');
    await sendMessageToTg(data.chatId, text)
}

export const buyHandler = async (data: CommandsQueueData) => {
    const text = 'Для приобретения месячной премиум-подписки пишите администратору бота @evgenyship' +
        '\nСтоимость премиум-подписки 500 рублей/мес'
    await sendMessageToTg(data.chatId, text, ParseMode.MARKDOWN)
}

export const profileHandler = async (data: CommandsQueueData) => {
    const userEntity = await getUser(data.user.id)
    if (!userEntity){
        const text = "Для того, чтобы получить информацию о профиле нужно сначала пообщаться с ботом или нажать /start"
        await sendMessageToTg(data.chatId, text, ParseMode.MARKDOWN)
        return
    }

    const {tgId, nickname, freeLimit, subscriptionUntil} = userEntity;
    const hasPaidSubscription = userHasPaidSubscription(userEntity)

    const message = `ID: ${tgId} \nЮзернейм: ${nickname} \nПодписка: ${hasPaidSubscription ? "премиум" : "бесплатная"}
    ${!hasPaidSubscription ? `\nЛимит запросов: ${freeLimit} / 10` : `\nДата окончания подписки :${formatDate(subscriptionUntil)}`}`
    await sendMessageToTg(data.chatId, message, ParseMode.MARKDOWN)
}

export const resetContextHandler = async (data: CommandsQueueData) => {
    await clearContext(data.chatId)
    await throttlingStorage.drop({chatId: data.chatId, userId: data.user.id})
    await sendMessageToTg(data.chatId,'Контекст очищен успешно!')
}