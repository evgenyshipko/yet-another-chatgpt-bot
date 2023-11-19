import OpenAI from "openai";
import * as dotenv from 'dotenv';
import {calcTokens, context, gptMessage} from "./context";

dotenv.config();

const openai = new OpenAI({apiKey: process.env.GPT_SECRET_TOKEN});

export enum GptRoles {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant'
}

const ask = async (chatId: number, text: string) => {

    const contextArr = await context.get(chatId)

    contextArr.push(gptMessage(GptRoles.USER, text))


    const rejectPromise = new Promise<OpenAI.Chat.Completions.ChatCompletion>((resolve, reject) => {
        setTimeout(() => reject('Timeout exceed'), 20000)
    })

    const completionPromise = openai.chat.completions.create({
        messages: contextArr,
        model: process.env.GPT_VERSION,
    });

    // TODO: добавить ретраи
    // TODO: в трай-кэтч написать мимимишное сообщение
    const res = await Promise.race([completionPromise, rejectPromise])

    const result = res.choices[0].message.content as string;

    contextArr.push(gptMessage(GptRoles.ASSISTANT, result))

    await context.save(chatId, contextArr)

    console.log('usage: ', res.usage.total_tokens, ',calc: ', calcTokens(contextArr))

    return {text: result, usage: res.usage.total_tokens}
}

export const gpt = {
    ask
}