import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { GameDB } from '@sql/Database';
import { ITebexTransactions } from '@sql/schema/Tebex.schema';
import LogManager from '@utils/Logger';
import axios from 'axios';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Tebex extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;

        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_TEBEX,

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
                .setName('tebex')
                .setDescription('Get system information')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('check')
                        .setDescription('Überpüft die Bestellung anhand der TBX Nummer')
                        .addStringOption((option) =>
                            option.setName('tbx').setDescription('Tebex Nummer').setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('checkold')
                        .setDescription('Überprüft eine alte Bestellung anhand der TBX Nummer')
                        .addStringOption((option) =>
                            option.setName('tbx').setDescription('Tebex Nummer').setRequired(true),
                        ),
                ),

            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const tbxNummer = interaction.options.getString('tbx');
        const useOldApi = interaction.options.getSubcommand() === 'checkold';

        if (!tbxNummer) {
            await this.replyWithEmbed({
                interaction,
                title: 'Fehler',
                description: 'Bitte gebe eine Tebex Nummer an.',
            });
            return;
        }

        if (/tbx-[0-9a-f]{13}-[0-9a-f]{6}/.test(tbxNummer)) {
            await this.replyWithEmbed({
                interaction,
                title: 'Fehler',
                description: 'Ungültige Tebex Nummer.',
            });
            return;
        }

        await this.checkTebexOrder(interaction, tbxNummer, useOldApi);
    }

    private async checkTebexOrder(
        interaction: ChatInputCommandInteraction,
        tbx: string,
        useOldApi: boolean = false,
    ): Promise<void> {
        try {
            const response = await axios.get(`${process.env.TEBEX_ENDPOINT}${tbx}`, {
                headers: {
                    'X-Tebex-Secret': useOldApi
                        ? process.env.TEBEX_SECRET_OLD
                        : process.env.TEBEX_SECRET,
                },
            });
            console.log(response);

            if (response.status !== 200 || !response.data) throw new Error('Invalid response');

            const fields = [
                {
                    name: 'Preis (gezahlt)',
                    value: `${response.data.amount} ${response.data.currency.iso_4217}`,
                },
                {
                    name: 'Datum und Uhrzeit',
                    value: new Date(response.data.date).toLocaleString('de-DE'),
                },
                {
                    name: 'Status',
                    value: response.data.status,
                },
                {
                    name: 'Artikel',
                    value: response.data.packages.map((p: any) => `[${p.id}] ${p.name}`).join('\n'),
                },
            ];
            const stateStringArray = [];
            if (!useOldApi) {
                const [transactions] = await GameDB.query<ITebexTransactions[]>(
                    'SELECT * FROM `tebex_transactions` WHERE `transaction` = ?',
                    [tbx],
                );
                if (transactions.length > 0) {
                    for (const transaction of transactions) {
                        stateStringArray.push(
                            `[${transaction.package}] ${
                                transaction.collected
                                    ? `Abgeholt am ${new Date(transaction.taketime).toLocaleString(
                                          'de-DE',
                                      )}`
                                    : 'Nicht abgeholz'
                            }`,
                        );
                    }
                    fields.push({
                        name: 'Abgeholt / erhalten',
                        value: stateStringArray.join('\n'),
                    });
                    fields.push({
                        name: 'Identifier',
                        value: transactions[0].identifier,
                    });
                }
                LogManager.debug(transactions);
            }
            fields.push({
                name: 'Tebex Username',
                value: response.data.player.name,
            });
            fields.push({
                name: 'EMail',
                value: response.data.email,
            });

            await this.replyWithEmbed({
                interaction,
                title: 'Tebex Bestellung',
                description: 'Bestellung gefunden',
                fields,
            });
        } catch (error) {
            await this.replyWithEmbed({
                interaction,
                title: 'Fehler',
                description: 'Fehler beim ausführen der Anfrage.',
            });
        }
    }
}
