import { MigrationInterface, QueryRunner } from "typeorm";

export class Subscriptions1700382152125 implements MigrationInterface {
    name = 'Subscriptions1700382152125'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "subscriptions" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "tg_user_id" character varying(256) NOT NULL, "date_create" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_eb660c4a66c2c5d344553401002" PRIMARY KEY ("uuid"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "subscriptions"`);
    }

}
