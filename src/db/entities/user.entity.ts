import {Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";


// TODO: добавить payment-токен от юкассы
@Entity("users")
export class UserEntity {
    @PrimaryGeneratedColumn("uuid")
    uuid?: string;

    @Column({
        type: "character varying",
        length: 256,
        nullable: false,
        unique: true })
    tgId: string;

    @Column({
        type: "character varying",
        length: 256,
        nullable: false,
        unique: true
    })
    nickname: string;

    @Column({
        type: "character varying",
        length: 256,
        nullable: true,
    })
    firstName?: string;

    @Column({
        type: "character varying",
        length: 256,
        nullable: true,
    })
    lastName?: string;

    @Column({
        type: "integer",
        nullable: false,
        default: 30,
    })
    freeLimit?: number

    @CreateDateColumn({ type: "timestamp with time zone", nullable: false })
    dateCreate?: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", nullable: false })
    dateUpdate?: Date;

    @DeleteDateColumn({ type: "timestamp with time zone" })
    dateDelete?: Date;
}