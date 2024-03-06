import { BotClient, Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import { RconClient } from '@prism/class/RconClient';
import { RegisterEvent } from '@prism/decorators';
import CommandManager from '@prism/manager/CommandManager';
import { CronManager } from '@prism/manager/CronManager';
import { EmoteManager } from '@prism/manager/EmoteManager';
import LogManager from '@prism/manager/LogManager';
import { CronJobService } from '@prism/services/CronJobService';
import { ExpressApp } from '@prism/web/ExpressApp';
import { CronJob } from 'cron';
import { Events } from 'discord.js';

export class BotReady {
    @RegisterEvent(Events.ClientReady)
    async onReady() {
        CommandManager.loadCommands(BotClient);
        new RconClient();
        Config.Bot.ServerID.forEach(async (id) => {
            await EmoteManager.updateBotEmotes(BotClient, id);
        });
        LogManager.info('Discord ready!');
    }

    @RegisterEvent(Events.ClientReady, true)
    async onceReady() {
        try {
            new ExpressApp();
            CronManager.initCronManager({
                'fraktionen.finance': new CronJob(
                    '0 0 */8 * * *',
                    () => CronJobService.logSocietyFinance(),
                    null,
                    null,
                    null,
                    null,
                    true,
                ),
                'server.playercount': new CronJob(
                    '0 */10 * * * *',
                    () => CronJobService.logPlayerCount(),
                    null,
                    null,
                    null,
                    null,
                    true,
                ),
                'txadmin.authenticate': new CronJob(
                    '0 0 */23 * * *',
                    () => CronJobService.txAdminAuthenticate(),
                    null,
                    null,
                    null,
                    null,
                    true,
                ),
                'txadmin.banpillegalphoto': new CronJob(
                    '0 */30 * * * *',
                    () => CronJobService.banPlayersWithIllegalPhoto(),
                    null,
                    null,
                    null,
                    null,
                    true,
                ),
                'server.checkDeadImages': new CronJob(
                    '0 */60 * * * *',
                    () => CronJobService.checkDeadImages(),
                    null,
                    null,
                    null,
                    null,
                    true,
                ),
            });
        } catch (error) {
            Sentry.captureException(error);
            LogManager.error(error);
        }
    }
}
