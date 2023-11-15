import Bull from "bull";
import * as dotenv from 'dotenv';
import {BotCommands, Command} from "./handlers/command";
dotenv.config()
export enum Queues {
    MESSAGE= "message",
    COMMANDS = "commands"
}

type User = {
    id: number,
    nickname: string,
    firstName: string,
    lastName: string
}

type MessageQueueData = {
    chatId: number,
    message: string,
    user: User
}

export type CommandsQueueData = {
    chatId: number,
    command: Command | BotCommands ,
    user: User,
}

export const getMessageQueue = () => new Bull<MessageQueueData>(Queues.MESSAGE, process.env.REDIS_URL);

export const getCommandsQueue = () => new Bull<CommandsQueueData>(Queues.COMMANDS, process.env.REDIS_URL);