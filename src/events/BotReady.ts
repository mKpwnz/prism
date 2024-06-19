import { BotClient, Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import { RconClient } from '@prism/class/RconClient';
import TxAdminClient from '@prism/clients/TxAdminClient';
import { botStatusUpdate } from '@prism/cronjobs/BotStatusUpdate.cron';
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
import { ActivityType, Events } from 'discord.js';

export class BotReady {
    @RegisterEvent(Events.ClientReady)
    async onReady() {
        if (BotClient.user) {
            const botUserId = BotClient.user.id;
            BotClient.guilds.cache.forEach(async (guild) => {
                const members = await guild.members.fetch();
                members.get(botUserId)?.setNickname(Config.Bot.BOT_NICKNAME);
            });
            BotClient.user.setStatus('dnd');
            BotClient.user.setActivity({
                name: `${Config.Bot.CurrentVersion} | Bot is starting...`,
                type: ActivityType.Custom,
            });

            try {
                if (BotClient.user.avatar !== Config.Bot.BOT_LOGO)
                    await BotClient.user.setAvatar(Config.Bot.BOT_LOGO);
            } catch (error) {
                LogManager.warn(error);
            }
            try {
                if (BotClient.user.username !== Config.Bot.BOT_USERNAME)
                    await BotClient.user.setUsername(Config.Bot.BOT_USERNAME);
            } catch (error) {
                LogManager.warn(error);
            }

            BotClient.user.setStatus('online');
        }
        CommandManager.loadCommands(BotClient);
        new RconClient();
        for (const id of Config.Bot.ServerID) {
            await EmoteManager.updateBotEmotes(BotClient, id);
        }
        await botStatusUpdate();
        LogManager.info('Discord ready!');
    }

    @RegisterEvent(Events.ClientReady, true)
    async onceReady() {
        try {
            new ExpressApp();
            CronManager.initCronManager({
                'bot.updateStatus': new CronJob(
                    '0 */1 * * * *',
                    () => botStatusUpdate(),
                    null,
                    null,
                    null,
                    null,
                    true,
                ),
                'server.playercount': new CronJob(
                    '0 */1 * * * *',
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
                    async () => {
                        setTimeout(async () => {
                            await CronJobService.banPlayersWithIllegalPhoto();
                        }, 10000);
                    },
                    null,
                    null,
                    null,
                    null,
                    true,
                ),
                'server.doFinancialAnalytics': new CronJob(
                    '0 */60 * * * *',
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
