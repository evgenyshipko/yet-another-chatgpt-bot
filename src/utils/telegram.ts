import * as dotenv from 'dotenv';
import {new_line} from "../handlers/command";
dotenv.config()
export enum ParseMode {
    MARKDOWN = 'Markdown'
}


const tgMessageHandler = (message: Record<string, unknown>) => {
    if (message.ok === false || message.error_code){
        throw new Error(`Code: ${message.error_code}, Description: ${message.description}`)
    }
}

export const sendMessageToTg = async (chatId: number, message: string, parseMode?: ParseMode) => {
    const botToken = process.env.BOT_TOKEN;
    let telegramAPI = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${message.replace(/\n/g, new_line)}`;
    if (parseMode){
        telegramAPI += `&parse_mode=${parseMode}`
    }
    const rawData = await fetch(telegramAPI, {method: 'POST'});
    const data = await rawData.json()
    tgMessageHandler(data)
    return data
}

export const deleteTgMessage = async (chatId: number, messageId: string) => {
    const botToken = process.env.BOT_TOKEN;
    const telegramAPI = `https://api.telegram.org/bot${botToken}/deleteMessage?chat_id=${chatId}&message_id=${messageId}`;
    const rawData = await fetch(telegramAPI, {method: 'POST'});
    const data = await rawData.json()
    tgMessageHandler(data)
    return data
}