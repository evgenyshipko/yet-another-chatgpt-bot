import OpenAI from "openai";
import * as dotenv from 'dotenv';
import {calcTokens, ChatGpt, context, gptMessage, Messages} from "./context";
import axios from "axios";

dotenv.config();

export enum GptRoles {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant'
}

const openaiQuery = async (messages: Messages, model: ChatGpt) => {
    const res = await axios.post<OpenAI.Chat.Completions.ChatCompletion>(
        `${process.env.GPT_PROXY}/v1/chat/completions`,
        {
            model,
            messages,
            temperature: 0.3
        },
        {
        headers: {
            Authorization: `Bearer ${process.env.GPT_SECRET_TOKEN}`,
            "Content-Type": "application/json"
        },
    })
    return res.data
}


const ask = async (chatId: number, text: string, model: ChatGpt) => {

    const contextArr = await context.get(chatId, model)

    contextArr.push(gptMessage(GptRoles.USER, text))


    const rejectPromise = new Promise<OpenAI.Chat.Completions.ChatCompletion>((resolve, reject) => {
        setTimeout(() => reject('Timeout exceed'), 400 * 1000)
    })

    const completionPromise = openaiQuery(contextArr, model)

    // TODO: добавить ретраи
    // TODO: в трай-кэтч написать мимимишное сообщение
    const res = await Promise.race([completionPromise, rejectPromise])

    const result = res.choices[0].message.content as string;

    contextArr.push(gptMessage(GptRoles.ASSISTANT, result))

    await context.save(chatId, contextArr)

    console.log('usage: ', res.usage.total_tokens, ',calc: ', calcTokens(contextArr, model))

    return {text: result, usage: res.usage.total_tokens}
}

export const gpt = {
    ask
}