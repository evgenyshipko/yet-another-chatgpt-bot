import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1699428967200 implements MigrationInterface {
    name = 'Initial1699428967200'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "tg_id" character varying(256) NOT NULL, "nickname" character varying(256) NOT NULL, "first_name" character varying(256), "last_name" character varying(256), "free_limit" integer NOT NULL DEFAULT '10', "date_create" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_update" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date_delete" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_9793d2defd72fffdb9a55c0d88f" UNIQUE ("tg_id"), CONSTRAINT "UQ_ad02a1be8707004cb805a4b5023" UNIQUE ("nickname"), CONSTRAINT "PK_951b8f1dfc94ac1d0301a14b7e1" PRIMARY KEY ("uuid"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
