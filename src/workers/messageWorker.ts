import * as dotenv from 'dotenv';
import {getMessageQueue} from "../queues";
import {ParseMode, telegramApi} from "../utils/telegramApi";
import {user as utilsUser} from "../utils/user";
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
            const isNotAvailableToSend = await throttlingStorage.check({chatId, userId: user.id})
            if (isNotAvailableToSend) {
                return;
            }

            log.info(`Message received from user_id: ${user.id}, chat_id: ${chatId}, message: ${message}`)

            await utilsUser.checkSession({
                tgId: user.id,
                nickname: user.nickname,
                firstName: user.firstName,
                lastName: user.lastName
            })

            const isSendingEnabled = await utilsUser.canMakeQuery(user.id)

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

            await utilsUser.decreaseFreeLimit(user.id)
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