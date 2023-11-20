import {user} from "../utils/user";
import * as fs from "fs";
import * as path from "path";
import {formatDate, subscriptionEnd} from "../utils/utils";
import {CommandsQueueData} from "../queues";
import {ParseMode, telegramApi} from "../utils/telegramApi";
import {throttlingStorage} from "../utils/redisStorage";
import {log} from "../utils/logs";
import {context} from "../utils/context";

export enum Command {
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
    const subscription = await user.getPaidSubscription(data.user.id.toString())

    if (subscription){
        const text = `Месячная премиум-подписка уже действует! \nДата окончания: ${formatDate(subscriptionEnd(subscription.dateCreate))}`
        await telegramApi.sendMessage(data.chatId, text)
        return;
    }

    await telegramApi.sendInvoice({
        chat_id: data.chatId,
        currency: 'RUB',
        description: 'Премиум подписка, которая позволяет безлимитно пользоваться ботом и открывает доступ к ChatGPT-4.\n' +
            'Срок действия подписки с момента покупки - 1 месяц.',
        title: 'Премиум-подписка',
        prices: [{label: 'Премиум-подписка', amount: 499*100 /* 499 рублей */}],
        payload: JSON.stringify({userId: data.user.id})
    })
}

export const profileHandler = async (data: CommandsQueueData) => {
    const userEntity = await user.get(data.user.id)
    if (!userEntity){
        const text = `Для того, чтобы получить информацию о профиле нужно сначала пообщаться с ботом или нажать ${BotCommands.START}`
        await telegramApi.sendMessage(data.chatId, text, ParseMode.MARKDOWN)
        return
    }

    const {tgId, nickname, freeLimit} = userEntity;
    const paidSubscription = await user.getPaidSubscription(tgId)

    const message = `ID: ${tgId} \nЮзернейм: ${nickname} \nПодписка: ${paidSubscription ? "премиум" : "бесплатная"}
    ${!paidSubscription ? `\nЛимит запросов: ${freeLimit} / 10` : `\nДата окончания подписки :${formatDate(subscriptionEnd(paidSubscription.dateCreate))}`}`
    await telegramApi.sendMessage(data.chatId, message, ParseMode.MARKDOWN)
}

export const resetContextHandler = async (data: CommandsQueueData) => {
    await context.clear(data.chatId)
    await throttlingStorage.drop({chatId: data.chatId, userId: data.user.id})
    await telegramApi.sendMessage(data.chatId,'Контекст очищен успешно!')
}