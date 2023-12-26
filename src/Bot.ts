import 'dotenv/config'; // THIS NEED TO BE AT THE TOP !!!IMPORTANT

import { EventHandler } from '@events/EventHandler';
import { Cache } from '@utils/Cache';
import LogManager from '@utils/Logger';
import { ExpressApp } from '@web/ExpressApp';
import { Client, Events, IntentsBitField } from 'discord.js';
import { CronManager } from '@utils/CronManager';
import { CronJob } from 'cron';
import { CronJobs } from '@controller/CronJobs.controller';

LogManager.configure();

const token = process.env.NODE_ENV === 'production' ? process.env.DISCORD_TOKEN_PROD : process.env.DISCORD_TOKEN_DEV;

LogManager.info('Bot is starting...');

const client = new Client({
    intents: [
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
    ],
});

Cache.init();
EventHandler.init(client);
client.login(token);
client.once(Events.ClientReady, async () => {
    new ExpressApp();
    if (process.env.NODE_ENV === 'production') {
        CronManager.initCronManager({
            'fraktionen.finance': new CronJob('0 0 */8 * * *', () => CronJobs.logSocietyFinance()),
        });
    } else {
        LogManager.debug('CronManager is disabled in DEV mode');
    }
});

export const BotClient = client;
