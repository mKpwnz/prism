import Config from '@prism/Config';
import { PrismaClient } from '@prisma/client';
import { createPool } from 'mysql2/promise';

const prisma = new PrismaClient();

export const GameDB = createPool({
    host: Config.ENV.SQL_HOST,
    database: Config.ENV.SQL_DATABASE,
    password: Config.ENV.SQL_PASS,
    user: Config.ENV.SQL_USER,
    port: Config.ENV.SQL_PORT,
});

export const BotDB = prisma;
