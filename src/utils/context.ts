import {contextStorage} from "./redisStorage";
import {encoding_for_model, TiktokenModel} from "tiktoken";
import {GptRoles} from "./gpt";

console.log('CONTEXT.ts', process.env.GPT_VERSION)

enum ChatGpt {
    GPT_3_5_TURBO = 'gpt-3.5-turbo',
    GPT_4 = 'gpt-4'
}

const ChatGptLimits = {
    [ChatGpt.GPT_3_5_TURBO]: 4096,
    [ChatGpt.GPT_4] : 8192
}

console.log('limit',ChatGptLimits[process.env.GPT_VERSION] - 3500)

export type Messages = Array<{content: string, role: GptRoles}>
export const gptMessage = (role: GptRoles, content: string) => ({ role, content })
export const calcTokens = (messages: Messages) => messages.reduce((acc,curr) => {
    const encoding = encoding_for_model(process.env.GPT_VERSION as TiktokenModel)
    return encoding.encode(curr.content).length + acc + 4
}, 0)

const trimContext = (messages: Messages) => {
    if (calcTokens(messages) >= ChatGptLimits[process.env.GPT_VERSION] - 3500){
        return messages.filter((val, index) => ![1,2].includes(index))
    }
    return messages
}

const getInitialMessage = () => gptMessage(GptRoles.SYSTEM, "You are a helpful assistant, which tries to answer short")

const save = async (chatId: string | number, data: Messages) => {
    await contextStorage.set({chatId, userId:chatId, value: data, expired: 60 * 60 * 24},)
}

const get = async (chatId: string | number) => {
    const context = await contextStorage.get({chatId, userId:chatId}) || [getInitialMessage()]
    return trimContext(context)
}
export const context = { save, get }