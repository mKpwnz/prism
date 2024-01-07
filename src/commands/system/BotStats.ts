import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { BotDB } from '@sql/Database';
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class BotStats extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_UNLIMITED,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.DEV.BOTTEST,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('botstats')
                .setDescription('Zeigt die aktuellen Nutzungsstatistiken des bots.'),
            this,
        );
        this.DoNotCountUse = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
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
            interaction,
            title: 'Bot Stats',
            description: `\`\`\`\n${table.toString()}\`\`\``,
        });
    }
}
