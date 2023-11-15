import * as dotenv from 'dotenv';
import {getMessageQueue} from "../queues";
import {deleteTgMessage, ParseMode, sendMessageToTg} from "../utils/telegram";
import {checkUserCanMakeQuery, createUserIfNotExist, decreaseFreeLimit} from "../utils/user";
import dataSource from "../db/ormconfig";
import {logError, logInfo} from "../utils/logs";
import {throttlingStorage} from "../utils/redisStorage";
import {askGpt} from "../utils/gpt";

(async () => {

    dotenv.config()

    const queue = getMessageQueue()

    await dataSource.initialize()

    queue.process(5, async (job, done) => {
        const {chatId, user, message} = job.data;
        try {
            const isNotAvailableToSend = await throttlingStorage.check({chatId, userId: user.id})
            if (isNotAvailableToSend) {
                return;
            }

            logInfo(`Message received from user_id: ${user.id}, chat_id: ${chatId}, message: ${message}`)

            await createUserIfNotExist({
                tgId: user.id,
                nickname: user.nickname,
                firstName: user.firstName,
                lastName: user.lastName
            })

            const isSendingEnabled = await checkUserCanMakeQuery(user.id)

            if (!isSendingEnabled) {
                const message = 'К сожалению у вас закончился пробный период 😢\n' +
                    'Для приобретения месячной подписки пишите администратору бота @evgenyship'
                await sendMessageToTg(chatId, message)
                return;
            }

            const reply = await sendMessageToTg(chatId, 'Выполняется обработка запроса, ждите! 😊');

            await throttlingStorage.set({chatId, userId: user.id, value: true, expired: 60})

            const {text: result} = await askGpt(chatId, message);

            await sendMessageToTg(chatId, result, ParseMode.MARKDOWN)

            await throttlingStorage.drop({chatId, userId: user.id})

            const messageToDelete = reply.result.message_id

            await deleteTgMessage(chatId, messageToDelete)

            await decreaseFreeLimit(user.id)
        } catch(error){
            logError(error)
            await throttlingStorage.drop({chatId, userId: user.id})
        } finally {
            done()
        }
    })

    console.log('Message worker started successfully!')

})()