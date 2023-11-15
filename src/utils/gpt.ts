import OpenAI from "openai";
import * as dotenv from 'dotenv';
import {contextStorage} from "./redisStorage";
import {calcTokens, context, gptMessage} from "./context";

dotenv.config();

const openai = new OpenAI({apiKey: process.env.GPT_SECRET_TOKEN});

export enum GptRoles {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant'
}

export const askGpt = async (chatId: number, text: string) => {

    const contextArr = await context.get(chatId)

    contextArr.push(gptMessage(GptRoles.USER, text))


    // TODO: добавить ретраи после какого-то времени ожидания
    const completion = await openai.chat.completions.create({
        messages: contextArr,
        model: process.env.GPT_VERSION,
    });

    const result = completion.choices[0].message.content as string;

    contextArr.push(gptMessage(GptRoles.ASSISTANT, result))

    await context.save(chatId, contextArr)

    console.log('usage: ', completion.usage.total_tokens, ',calc: ', calcTokens(contextArr))


    return {text: result, usage: completion.usage.total_tokens}
}

export const clearContext = async (chatId: number) => {
    await contextStorage.drop({chatId, userId: chatId})
}