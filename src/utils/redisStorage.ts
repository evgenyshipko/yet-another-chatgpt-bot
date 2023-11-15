import {createClient} from 'redis';
import * as process from "process";

let redis;

const initRedis = async () => {redis = await createClient({url: process.env.REDIS_URL})
    .on('error', err => console.log('Redis Client Error', err))
    .connect()};

initRedis()

type Props = {chatId: string | number, userId: string | number}

type SetProps = {value: unknown, expired?: number} & Props


const getKey = (key, {chatId, userId}:Props) => `${key}:${chatId}:${userId}`

const set = (key: string) => async ({value, expired, userId, chatId}: SetProps) => {
    if (redis){
        await redis.set(getKey(key, {userId, chatId}), JSON.stringify(value), expired ? 'EX' : undefined, expired)
    }
}

const drop = (key: string) => async (props:Props) => {
    if (redis){
        await redis.del(getKey(key, props))
    }
}

const check = (key: string) => async (props:Props) => {
    let res;
    if (redis){
        res = await redis.get(getKey(key, props))
    }
    return Boolean(res)
}

const get = (key: string) => async (props:Props) => {
    let res;
    if (redis){
        res = await redis.get(getKey(key, props))
    }
    return JSON.parse(res)
}


const createRedisStorage = (key: string) => ({
    set: set(key), drop: drop(key), check: check(key), get: get(key)
})


export const throttlingStorage = createRedisStorage('throttling')

export const sessionStorage = createRedisStorage('session')

export const contextStorage = createRedisStorage('context')

export const helpRedisStorage = createRedisStorage('help')