import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { ItemService } from '@services/ItemService';
import Config from '@Config';
import { Cache } from '@utils/Cache';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class CachePerformance extends Command {
    constructor() {
        super();
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('cacheperformance')
                .setDescription('Performance Test für den Cache.'),
            this,
        );
        this.DoNotCountUse = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await Cache.testPerformance(
            interaction,
            async () => {
                const res = await ItemService.doesItemExists('fixkit');
                LogManager.debug(res);
            },
            'items',
        );
    }
}
