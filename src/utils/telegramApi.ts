import * as dotenv from 'dotenv';
import axios from "axios";
import * as process from "process";

dotenv.config()
export enum ParseMode {
    MARKDOWN = 'Markdown'
}

const tgMessageHandler = (message: Record<string, unknown>) => {
    if (message.ok === false || message.error_code){
        throw new Error(`Code: ${message.error_code}, Description: ${message.description}`)
    }
}

const tgQuery = async (methodName: string, params: Record<string, unknown>) => {
    const botToken = process.env.BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/${methodName}`;
    const response = await axios.post(url, params);
    tgMessageHandler(response.data)
    return response.data
}

const sendMessage = async (chatId: number, message: string, parseMode?: ParseMode) => {
    return tgQuery('sendMessage', {text: message, chat_id: chatId, parse_mode: parseMode})
}

const deleteMessage = async (chatId: number, messageId: string) => {
    return tgQuery('deleteMessage', {chat_id: chatId, message_id: messageId})
}

type SendInvoiceParams = {
    chat_id: number,
    title: string,
    description: string,
    payload: string,
    currency: string,
    prices: Array<{label: string, amount: number}>
}

const sendInvoice = async (params: SendInvoiceParams) => {
    return tgQuery('sendInvoice', {...params, provider_token: process.env.YOU_KASSA_TOKEN})
}


export const telegramApi = {
    sendMessage, deleteMessage, sendInvoice
}
