import * as dotenv from 'dotenv';
import {getMessageQueue} from "../queues";
import {ParseMode, telegramApi} from "../utils/telegramApi";
import {checkUserCanMakeQuery, createUserIfNotExist, decreaseFreeLimit} from "../utils/user";
import dataSource from "../db/ormconfig";
import {throttlingStorage} from "../utils/redisStorage";
import {gpt} from "../utils/gpt";
import {log} from "../utils/logs";

(async () => {

    process.title = 'Bot: message worker'

    dotenv.config()

    log.init()

    const queue = getMessageQueue()

    await dataSource.initialize()

    queue.process(50, async (job, done) => {
        const {chatId, user, message} = job.data;
        try {

            const time1 = performance.now()

            const isNotAvailableToSend = await throttlingStorage.check({chatId, userId: user.id})
            if (isNotAvailableToSend) {
                return;
            }

            const time2 = performance.now()

            log.info(`Message received from user_id: ${user.id}, chat_id: ${chatId}, message: ${message}`)

            const time3 = performance.now()

            await createUserIfNotExist({
                tgId: user.id,
                nickname: user.nickname,
                firstName: user.firstName,
                lastName: user.lastName
            })
            const time4 = performance.now()

            log.info(`REDIS: ${time2-time1}, PG: ${time4-time3}`)

            const isSendingEnabled = await checkUserCanMakeQuery(user.id)

            if (!isSendingEnabled) {
                const message = 'К сожалению у вас закончился пробный период 😢\n' +
                    'Для приобретения месячной подписки пишите администратору бота @evgenyship'
                await telegramApi.sendMessage(chatId, message)
                return;
            }

            const reply = await telegramApi.sendMessage(chatId, 'Выполняется обработка запроса, ждите! 😊');

            await throttlingStorage.set({chatId, userId: user.id, value: true, expired: 60})

            const {text: result} = await gpt.ask(chatId, message);

            await telegramApi.sendMessage(chatId, result, ParseMode.MARKDOWN)

            await throttlingStorage.drop({chatId, userId: user.id})

            const messageToDelete = reply.result.message_id

            await telegramApi.deleteMessage(chatId, messageToDelete)

            await decreaseFreeLimit(user.id)
        } catch(error){
            log.error(error)
            await throttlingStorage.drop({chatId, userId: user.id})
            await telegramApi.sendMessage(job.data.chatId, 'Что-то пошло не так, попробуйте снова!')
        } finally {
            done()
        }
    })

    log.info('Message worker started successfully!')

})()