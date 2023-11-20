import {Context, Telegraf} from "telegraf";
import {message} from "telegraf/filters";
import {getMessageQueue, getPaymentsQueue} from "../queues";
import {log} from "../utils/logs";

export const paymentHandler = (bot:Telegraf<Context>) => bot.on(message("successful_payment"), (ctx) => {
    console.log('ctx.update.message.successful_payment', ctx.update.message.successful_payment)

    const tgUser = ctx.update.message.from

    const queue = getPaymentsQueue();

    queue.add({
        tgUserId: tgUser.id
    }).then(() => log.info(`Message from user_id: ${tgUser.id} added to payment queue`))
});