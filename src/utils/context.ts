import {contextStorage} from "./redisStorage";
import {encoding_for_model, TiktokenModel} from "tiktoken";
import {GptRoles} from "./gpt";

export enum ChatGpt {
    GPT_3_5_TURBO = 'gpt-3.5-turbo',
    GPT_4 = 'gpt-4'
}

const ChatGptLimits = {
    [ChatGpt.GPT_3_5_TURBO]: 4096,
    [ChatGpt.GPT_4] : 8192
}

export type Messages = Array<{content: string, role: GptRoles}>
export const gptMessage = (role: GptRoles, content: string) => ({ role, content })
export const calcTokens = (messages: Messages, gptVersion: ChatGpt) => messages.reduce((acc,curr) => {
    const encoding = encoding_for_model(gptVersion as TiktokenModel)
    return encoding.encode(curr.content).length + acc + 4
}, 0)

const trimContext = (messages: Messages, gptVersion: ChatGpt) => {
    if (calcTokens(messages, gptVersion) >= ChatGptLimits[gptVersion] / 2 ){
        return messages.filter((val, index) => ![1,2].includes(index))
    }
    return messages
}

const getInitialMessage = () => gptMessage(GptRoles.SYSTEM, "You are a helpful assistant, which tries to answer short")

const save = async (chatId: string | number, data: Messages) => {
    await contextStorage.set({chatId, userId:chatId, value: data, expired: 60 * 60 * 24},)
}

const get = async (chatId: string | number, gptVersion: ChatGpt) => {

    console.log('CONTEXT',await contextStorage.get({chatId, userId:chatId}))

    const context = await contextStorage.get({chatId, userId:chatId}) || [getInitialMessage()]

    console.log('CONTEXT1',context)


    return trimContext(context, gptVersion)
}

const clear = async (chatId: number) => {
    await contextStorage.drop({chatId, userId: chatId})
}

export const context = { save, get, clear }