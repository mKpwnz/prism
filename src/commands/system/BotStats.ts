import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { BotDB } from '@prism/sql/Database';
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3';
import { SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('botstats')
        .setDescription('Zeigt die aktuellen Nutzungsstatistiken des bots.'),
)
export class BotStats extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        this.DoNotCountUse = true;
    }

    async execute(): Promise<void> {
        const data = await BotDB.command_log.groupBy({
            by: ['command'],
            _count: {
                command: true,
            },
            orderBy: {
                _count: {
                    command: 'desc',
                },
            },
        });

        const table = new AsciiTable3('Command Stats')
            .setStyle('unicode-single')
            .setHeading('Command', 'Count')
            .setAlign(1, AlignmentEnum.LEFT)
            .setAlign(2, AlignmentEnum.RIGHT);
        data.forEach((d) => {
            table.addRow(d.command, d._count.command);
        });

        await this.replyWithEmbed({
            description: `\`\`\`\n${table.toString()}\`\`\``,
        });
    }
}
