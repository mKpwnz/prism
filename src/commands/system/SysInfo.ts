import Config from '@Config';
import { Command } from '@class/Command';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { SlashCommandBuilder } from 'discord.js';

export class SysInfo extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
            Config.Channels.DEV.PRISM_TESTING,
        ];

        initCommandOld(
            new SlashCommandBuilder().setName('sysinfo').setDescription('Get system information'),
            this,
        );
    }

    async execute(): Promise<void> {
        await this.replyWithEmbed({
            fields: [
                { name: 'NodeJS Version', value: process.version },
                { name: 'Platform', value: process.platform },
                { name: 'Architecture', value: process.arch },
                {
                    name: 'Memory Usage',
                    value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                },
                { name: 'Uptime', value: `${process.uptime()} seconds` },
            ],
            title: 'System Information',
            description: 'Current Hostsystem:',
        });
    }
}
