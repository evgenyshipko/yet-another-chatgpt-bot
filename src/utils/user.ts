import {getRepository} from "../db/ormconfig";
import {UserEntity} from "../db/entities/user.entity";
import {log} from "./logs";
import {sessionStorage} from "./redisStorage";
import {SubscriptionEntity} from "../db/entities/subscription.entity";
import {subscriptionEnd} from "./utils";

const userRepo = getRepository(UserEntity);

type CreateUser = {
    tgId: number,
    nickname: string,
    firstName?: string;
    lastName?: string;
}
const getPaidSubscription = async (tgId: string) => {
    const subscriptions = await getRepository(SubscriptionEntity).find(
        {where: {tgUserId: tgId}, order: {dateCreate: "DESC"}},
    )
    if (subscriptions && subscriptions.length > 0){
        const subscriptionStart = subscriptions[0].dateCreate
        if(subscriptionEnd(subscriptionStart) > new Date()){
            return subscriptions[0]
        }
    }
    return null
}

const decreaseFreeLimit = async (tgId: number) => {
    const userData = await userRepo.findOne({where: {tgId: tgId.toString()}})
    if (!await getPaidSubscription(tgId.toString())){
        const newLimit = userData.freeLimit - 1
        await userRepo.update({tgId: tgId.toString()}, {freeLimit: newLimit })
    }
}

const canMakeQuery = async (tgId: number) => {
    const userData = await userRepo.findOne({where: {tgId: tgId.toString()}})
    const paidSubscription = await getPaidSubscription(userData.tgId)
    return userData.freeLimit > 0 || paidSubscription
}

const get = async (tgId: number) => {
    return userRepo.findOne({where: {tgId: tgId.toString()}})
}

const checkSession = async (user: CreateUser) => {
    const existsInCache = await sessionStorage.get({ userId: user.tgId, chatId: user.tgId})
    if (!existsInCache){
        const userData = await get(user.tgId)
        if (!userData){
            await userRepo.save({...user, tgId: user.tgId.toString()})
            log.info(`User: id: ${user.tgId}, nickname: ${user.nickname} registered`)
        }
        const userData1 = await get(user.tgId)
        await sessionStorage.set({value: userData1, userId: user.tgId, chatId: user.tgId})
    }
}

export const user = {
    get, canMakeQuery, decreaseFreeLimit, getPaidSubscription, checkSession
}