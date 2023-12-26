import { PrismaClient } from '@prisma/client';
import { createPool } from 'mysql2/promise';

const prisma = new PrismaClient();

export const GameDB = createPool({
    host: process.env.SQL_HOST,
    database: process.env.SQL_DATABASE,
    password: process.env.SQL_PASS,
    user: process.env.SQL_USER,
    port: parseInt(process.env.SQL_PORT ?? '3306', 10),
});

export const BotDB = prisma;
