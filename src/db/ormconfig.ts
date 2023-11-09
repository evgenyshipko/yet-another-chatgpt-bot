import {ConnectionOptions, DataSource, EntityTarget, Repository, SimpleConsoleLogger} from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

dotenv.config();

export enum NodeEnv {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  MIGRATION = 'migration',
}

const { NODE_ENV, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT, DB_HOST } =
  process.env;

export const postgresConnectionOptions: ConnectionOptions = {
  type: 'postgres',
  host: DB_HOST,
  port: Number(DB_PORT),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  logging: NODE_ENV === NodeEnv.DEVELOPMENT,
  logger:
    NODE_ENV === NodeEnv.MIGRATION ? new SimpleConsoleLogger(false) : undefined,
  migrations: [`${__dirname}/migrations/**/*{.ts,.js}`],
  migrationsRun: false,
  entities: [`${__dirname}/entities/*.entity{.ts,.js}`],
  synchronize: false,
  migrationsTransactionMode: 'each',
  namingStrategy: new SnakeNamingStrategy(),
};

const dataSource = new DataSource(postgresConnectionOptions);
export const getRepository = <T>(classProp: EntityTarget<T>): Repository<T> =>
    dataSource.getRepository(classProp);

export default dataSource;