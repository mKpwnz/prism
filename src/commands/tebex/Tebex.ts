import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { GameDB } from '@prism/sql/Database';
import { ITebexTransactions } from '@prism/sql/schema/Tebex.schema';
import axios from 'axios';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

// @TODO: Rewrite to Service structure
@RegisterCommand(
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
)
export class Tebex extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_TEBEX,
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
    }

    // TODO: Change to Service Structure
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const tbxNummer = interaction.options.getString('tbx', true);
        const useOldApi = interaction.options.getSubcommand() === 'checkold';

        if (!/tbx-[0-9a-f]{13,14}-[0-9a-f]{6}/.test(tbxNummer)) {
            await this.replyError('Ungültige Tebex Nummer.');
            return;
        }

        await this.checkTebexOrder(tbxNummer, useOldApi);
    }

    private async checkTebexOrder(tbx: string, useOldApi: boolean = false): Promise<void> {
        try {
            const response = await axios.get(`${Config.ENV.TEBEX_ENDPOINT}${tbx}`, {
                headers: {
                    'X-Tebex-Secret': useOldApi
                        ? Config.ENV.TEBEX_SECRET_OLD
                        : Config.ENV.TEBEX_SECRET,
                },
            });

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
                title: 'Tebex Bestellung',
                description: 'Bestellung gefunden',
                fields,
            });
        } catch (error) {
            await this.replyError('Fehler beim ausführen der Anfrage.');
        }
    }
}
