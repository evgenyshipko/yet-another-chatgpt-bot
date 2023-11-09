import {encoding_for_model} from "tiktoken"
import {GptRoles} from "./gpt";
import { ru } from "date-fns/locale";
import { format } from "date-fns";

const encoding = encoding_for_model('gpt-3.5-turbo')

export type Messages = Array<{content: string, role: GptRoles}>
export const calcTokens = (messages: Messages) => messages.reduce((acc,curr) => {
    return encoding.encode(curr.content).length + acc + 4
}, 0)

//TODO: имплементировать очистку контекста
export const limitedMessages = (messages: Messages, limit: number) => {
    if (calcTokens(messages) >= limit){
        return messages.filter((val, index) => ![1,2].includes(index))
    }
    return messages
}

export const formatDate = (
    date: Date | number,
    formatString = "dd/MM/yyyy",
    options = { locale: ru }
): string => format(date, formatString, options);