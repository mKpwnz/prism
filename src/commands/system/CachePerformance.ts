import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { NvhxData } from '@controller/NvhxData.controller';
import Config from '@proot/Config';
import { Cache } from '@utils/Cache';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class CachePerformance extends Command {
    constructor() {
        super();
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
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
                const NvhxGlobalBans = await NvhxData.GetAllGlobalBans();
                const players = await NvhxData.CheckIfUserIsBanned(
                    ['steam:11000010ea14dfd'],
                    NvhxGlobalBans,
                );
                LogManager.debug(players);
                return players;
            },
            'nvhxGlobalBans',
        );
    }
}
