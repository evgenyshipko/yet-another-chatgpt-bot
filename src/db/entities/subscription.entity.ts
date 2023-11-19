import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity("subscriptions")
export class SubscriptionEntity {
    @PrimaryGeneratedColumn("uuid")
    uuid?: string;

    @Column({
        type: "character varying",
        length: 256,
        nullable: false,
    })
    tgUserId: string;

    @CreateDateColumn({ type: "timestamp with time zone", nullable: false })
    dateCreate?: Date;
}