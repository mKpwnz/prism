import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { Helper } from '@prism/utils/Helper';
import { SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder().setName('sysinfo').setDescription('Get system information'),
)
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
                { name: 'Uptime', value: `${Helper.formatUptime(process.uptime())}` },
            ],
            title: 'System Information',
            description: 'Current Hostsystem:',
        });
    }
}
