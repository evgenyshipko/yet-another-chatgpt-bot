import {getRepository} from "../db/ormconfig";
import {UserEntity} from "../db/entities/user.entity";
import {logInfo} from "./logs";

const userRepo = getRepository(UserEntity);

type CreateUser = {
    tgId: number,
    nickname: string,
    firstName?: string;
    lastName?: string;
}
export const createUserIfNotExist = async (user: CreateUser) => {
    const userData = await userRepo.findOne({where: {tgId: user.tgId.toString()}})
    if (!userData){
        await userRepo.save({...user, tgId: user.tgId.toString()})
        logInfo(`User: id: ${user.tgId}, nickname: ${user.nickname} registered`)
    }
}

//TODO: платные подписки в отдельную базу
export const userHasPaidSubscription = (user: UserEntity) => {
    return user.subscriptionUntil && user.subscriptionUntil > new Date()
}


export const decreaseFreeLimit = async (tgId: number) => {
    const userData = await userRepo.findOne({where: {tgId: tgId.toString()}})
    if (!userHasPaidSubscription(userData)){
        const newLimit = userData.freeLimit - 1
        await userRepo.update({tgId: tgId.toString()}, {freeLimit: newLimit })
    }
}

export const checkUserCanMakeQuery = async (tgId: number) => {
    const userData = await userRepo.findOne({where: {tgId: tgId.toString()}})
    return userData.freeLimit > 0 || userHasPaidSubscription(userData)
}

export const getUser = async (tgId: number) => {
    return userRepo.findOne({where: {tgId: tgId.toString()}})
}

