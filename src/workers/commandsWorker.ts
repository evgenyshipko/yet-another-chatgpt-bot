import * as dotenv from "dotenv";
import {getCommandsQueue, getMessageQueue} from "../queues";
import dataSource from "../db/ormconfig";
import {BotCommands, buyHandler, Command, helpHandler, profileHandler, resetContextHandler} from "../handlers/command";
import {telegramApi} from "../utils/telegramApi";
import {log} from "../utils/logs";

(async () => {

    process.title = 'Bot: commands worker'

    dotenv.config()

    log.init()

    const queue = getCommandsQueue()

    await dataSource.initialize()

    queue.process(5, async (job, done) => {
        try{
            const { command} = job.data;

            if([Command.HELP, BotCommands.HELP].includes(command)){
                await helpHandler(job.data)
            }else if([Command.BUY, BotCommands.BUY].includes(command)){
                await buyHandler(job.data)
            }else if ([Command.PROFILE, BotCommands.PROFILE].includes(command)){
                await profileHandler(job.data)
            }else if ([Command.RESET_CONTEXT, BotCommands.RESET_CONTEXT].includes(command)){
                await resetContextHandler(job.data)
            } else if([BotCommands.START]){
                console.log('BOT COMMANDS START')
            }

            done();
        }catch (e){
            log.error(e)
            await telegramApi.sendMessage(job.data.chatId, 'Что-то пошло не так, попробуйте снова!')
            done();
        }
    })

    log.info('Commands worker started successfully!')
})()