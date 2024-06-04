import Config from '@prism/Config';
import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '@prism/sql/botSchema/BotSchema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolve } from 'path';
import LogManager from '@prism/manager/LogManager';

export const GameDB = createPool({
    host: Config.ENV.SQL_HOST,
    database: Config.ENV.SQL_DATABASE,
    password: Config.ENV.SQL_PASS,
    user: Config.ENV.SQL_USER,
    port: Config.ENV.SQL_PORT,
});

export const DrizzleClient = new Client({
    host: Config.ENV.POSTGRES_HOST,
    port: Config.ENV.POSTGRES_PORT,
    user: Config.ENV.POSTGRES_USER,
    password: Config.ENV.POSTGRES_PASSWORD,
    database: Config.ENV.POSTGRES_DB,
});

export const BotDB = drizzle(DrizzleClient, { schema });

export async function InitDatabase() {
    LogManager.info('Connecting to BotDB...');
    try {
        await DrizzleClient.connect();
        LogManager.info('Migrating last BotDB changes...');
        await migrate(BotDB, { migrationsFolder: resolve(__dirname, '../drizzle') });
    } catch (e) {
        LogManager.error('Error connecting to BotDB or migrating last changes. Exiting...');
        LogManager.error(e);
        process.exit(1);
    } finally {
        LogManager.info('BotDB connected and migrated.');
    }
}
