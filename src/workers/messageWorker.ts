import * as dotenv from 'dotenv';
import {getMessageQueue, getPaymentsQueue} from "../queues";
import {ParseMode, telegramApi} from "../utils/telegramApi";
import {user as utilsUser} from "../utils/user";
import dataSource from "../db/ormconfig";
import {throttlingStorage} from "../utils/redisStorage";
import {gpt} from "../utils/gpt";
import {log} from "../utils/logs";
import {ChatGpt} from "../utils/context";
import {EXCEED_FREE_LIMIT, MESSAGE_PROCESSING_START, SOMETHING_WENT_WRONG} from "../text";

(async () => {

    process.title = 'Bot: message worker'

    dotenv.config()

    log.init()

    const queue = getMessageQueue()

    await dataSource.initialize()

    // TODO: разобраться с concurrency в bull
    queue.process(50, async (job, done) => {
        const {chatId, user, message} = job.data;
        try {
            const isThrottled = await throttlingStorage.check({chatId, userId: user.id})
            if (isThrottled) {
                return;
            }

            log.info(`Message received from user_id: ${user.id}, chat_id: ${chatId}, message: ${message}`)

            await utilsUser.checkSession({
                tgId: user.id,
                nickname: user.nickname,
                firstName: user.firstName,
                lastName: user.lastName
            })

            const {canMakeQuery, paidSubscription} = await utilsUser.canMakeQuery(user.id)

            if (!canMakeQuery) {
                await telegramApi.sendMessage(chatId, EXCEED_FREE_LIMIT)
                return;
            }

            const reply = await telegramApi.sendMessage(chatId, MESSAGE_PROCESSING_START);

            await throttlingStorage.set({chatId, userId: user.id, value: true, expired: 60})

            // TODO: перед показом миру - раскомментить
            // const model = paidSubscription ? ChatGpt.GPT_4 : ChatGpt.GPT_3_5_TURBO

            const model = ChatGpt.GPT_3_5_TURBO

            const {text: result} = await gpt.ask(chatId, message, model);

            await telegramApi.sendMessage(chatId, result, ParseMode.MARKDOWN)

            await throttlingStorage.drop({chatId, userId: user.id})

            const messageToDelete = reply.result.message_id

            await telegramApi.deleteMessage(chatId, messageToDelete)

            await utilsUser.decreaseFreeLimit(user.id)
        } catch(error){
            log.error(error)
            await throttlingStorage.drop({chatId, userId: user.id})
            await telegramApi.sendMessage(job.data.chatId, SOMETHING_WENT_WRONG)
        } finally {
            done()
        }
    })

    // TODO: нормально ли обрабатывать несколько очередей в одном воркере
    const paymentQueue = getPaymentsQueue()

    paymentQueue.process(50, async (job, done) => {
        // TODO: try-catch
        const userId = job.data.tgUserId
        await utilsUser.buySubscription(userId)
        log.info(`User ${userId} купил подписку!`)
        // TODO: поздравительное сообщение
        done()
    })


    log.info('Message worker started successfully!')

})()