import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import Config from '@proot/Config';
import { BotDB } from '@sql/Database';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class TestCommand extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
        ];
        RegisterCommand(
            new SlashCommandBuilder().setName('testcommand').setDescription('Test Command'),
            this,
        );
        this.DoNotCountUse = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const data = await BotDB.society_finance.findMany({
            where: {
                job: 'police',
            },
        });
        const cLabels: string[] = [];
        const cCash: number[] = [];
        const cBlack: number[] = [];
        const cBank: number[] = [];
        data.forEach((el) => {
            cLabels.push(el.created_at.toLocaleString('de-DE'));
            cCash.push(Number(el.money));
            cBlack.push(Number(el.black));
            cBank.push(Number(el.bank));
        });
        LogManager.debug({
            labels: cLabels,
            datasets: [
                {
                    label: 'Bankkonto',
                    data: cBank,
                    fill: false,
                    borderColor: '#0792f1',
                    tension: 0.1,
                },
                {
                    label: 'Schwarzgeld Tresor',
                    data: cBlack,
                    fill: false,
                    borderColor: '#e91916',
                    tension: 0.1,
                },
                {
                    label: 'Geldtresor',
                    data: cCash,
                    fill: false,
                    borderColor: '#17bf6b',
                    tension: 0.1,
                },
            ],
        });
        await interaction.reply({ content: `Test` });
    }
}
