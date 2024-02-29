import 'dotenv/config'; // THIS NEED TO BE AT THE TOP !!!IMPORTANT
import Config from '@Config';
import { EventHandler } from '@events/EventHandler';
import { CronJobService } from '@services/CronJobService';
import { Cache } from '@class/Cache';
import { CronManager } from '@manager/CronManager';
import LogManager from '@manager/LogManager';
import { ExpressApp } from '@web/ExpressApp';
import { CronJob } from 'cron';
import { Client, Events, IntentsBitField, Partials } from 'discord.js';

LogManager.configure();
LogManager.info('Bot is starting...');

const client = new Client({
    intents: [
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

Cache.init();
EventHandler.init(client);
client.login(Config.ENV.DISCORD_TOKEN);
client.once(Events.ClientReady, async () => {
    try {
        new ExpressApp();
        await CronJobService.txAdminAuthenticate();
        if (Config.ENV.NODE_ENV === 'production') {
            CronManager.initCronManager({
                'fraktionen.finance': new CronJob('0 0 */8 * * *', () =>
                    CronJobService.logSocietyFinance(),
                ),
                'server.playercount': new CronJob('0 */10 * * * *', () => {
                    CronJobService.logPlayerCount();
                }),
                'txadmin.authenticate': new CronJob('0 0 */23 * * *', () => {
                    CronJobService.txAdminAuthenticate();
                }),
                'txadmin.banpillegalphoto': new CronJob('0 */30 * * * *', () => {
                    CronJobService.banPlayersWithIllegalPhoto();
                }),
            });
        } else {
            LogManager.debug('CronManager is disabled in DEV mode');
        }
    } catch (e) {
        LogManager.error('Error while starting the bot', e);
    }
});

export const BotClient = client;
