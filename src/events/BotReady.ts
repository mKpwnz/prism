import { BotClient, Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import { RconClient } from '@prism/class/RconClient';
import TxAdminClient from '@prism/clients/TxAdminClient';
import { checkDeadImages } from '@prism/cronjobs/CheckDeadImages.cron';
import { doFinancialAnalytics } from '@prism/cronjobs/FinancialAnalytics.cron';
import { logPlayerCount } from '@prism/cronjobs/LogPlayerCount.cron';
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
                'server.playercount': new CronJob(
                    '0 */10 * * * *',
                    () => logPlayerCount(),
                    null,
                    null,
                    null,
                    null,
                    true,
                ),
                'txadmin.authenticate': new CronJob(
                    '0 0 */23 * * *',
                    async () => {
                        await TxAdminClient.authenticate();
                        LogManager.log('CronJobs: txAdminAuthenticate() done.');
                    },
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
                    () => checkDeadImages(),
                    null,
                    null,
                    null,
                    null,
                    true,
                ),
                'server.doFinancialAnalytics': new CronJob(
                    '0 */20 * * * *',
                    () => doFinancialAnalytics(),
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
