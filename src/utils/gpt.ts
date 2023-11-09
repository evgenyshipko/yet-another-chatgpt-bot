import OpenAI from "openai";
import * as dotenv from 'dotenv';
import {Messages} from "./utils";

dotenv.config();

const openai = new OpenAI({apiKey: process.env.GPT_SECRET_TOKEN});

export enum GptRoles {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant'
}

const gptMessage = (role: GptRoles, content: string) => ({ role, content })
const getInitialMessage = () => gptMessage(GptRoles.SYSTEM, "You are a helpful assistant, which tries to make short answers")

const context: Record<string, Messages> = {}
export const askGpt = async (chatId: number, text: string) => {

    const newMessage = gptMessage(GptRoles.USER, text)

    if (!context[chatId]){
        context[chatId] = [getInitialMessage()]
    }

    context[chatId].push(newMessage)

    const completion = await openai.chat.completions.create({
        messages: context[chatId],
        model: process.env.GPT_VERSION,
    });

    const result = completion.choices[0].message.content as string;
    context[chatId].push(gptMessage(GptRoles.ASSISTANT, result))
    return {text: result, usage: completion.usage.total_tokens}
}

export const clearContext = (chatId: number) => {
    delete context[chatId];
}