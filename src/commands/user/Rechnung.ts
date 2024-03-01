import { Command } from '@class/Command';
import { initCommandOld } from '@commands/CommandHandler';
import { PlayerService } from '@services/PlayerService';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import { GameDB } from '@sql/Database';
import { IBilling } from '@sql/schema/Billing.schema';
import { IJob } from '@sql/schema/Job.schema';
import LogManager from '@manager/LogManager';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';
import { sendToChannel } from '@utils/DiscordHelper';

export class Rechnung extends Command {
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
        initCommandOld(
            new SlashCommandBuilder()
                .setName('rechnung')
                .setDescription('Befehle rund um das Rechnungsmenü')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('suchen')
                        .setDescription('Suche nach Rechnungen eines bestimmten Spielers')
                        .addStringOption((option) =>
                            option
                                .setName('steamid')
                                .setDescription('SteamID des Spielers')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('status')
                                .setDescription('Filtert nach einem Status')
                                .addChoices(
                                    { name: 'Unbezahlt', value: 'unpaid' },
                                    { name: 'Bezahlt', value: 'paid' },
                                    { name: 'Automatisch Bezahlt', value: 'autopaid' },
                                    { name: 'Alle', value: 'all' },
                                ),
                        )
                        .addIntegerOption((option) =>
                            option.setName('page').setDescription('Seitenzahl'),
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('limit')
                                .setDescription('Limit an Ergebnissen Default: 5 Max: 10'),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('anzeigen')
                        .setDescription('Zeigt eine bestimmte Rechnung anhand der ID an')
                        .addIntegerOption((option) =>
                            option
                                .setName('id')
                                .setDescription('ID der Rechnung')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('bezahlen')
                        .setDescription('Bezahle die Rechnung eines Spielers')
                        .addIntegerOption((option) =>
                            option
                                .setName('id')
                                .setDescription('ID der Rechnung')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('löschen')
                        .setDescription('Löscht die Rechnung eines Spielers')
                        .addIntegerOption((option) =>
                            option
                                .setName('id')
                                .setDescription('ID der Rechnung')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('erstellen')
                        .setDescription('Stelle eine Rechnung für einen Spieler aus')
                        .addStringOption((option) =>
                            option
                                .setName('steamid')
                                .setDescription('SteamID des Spielers')
                                .setRequired(true),
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('betrag')
                                .setDescription('Betrag der Rechnung')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('grund')
                                .setDescription('Grund der Rechnung')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('sender')
                                .setDescription(
                                    'Sender der Rechunng (Fraktionsname) Beispiel: police Default: dortmund',
                                ),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('beschreibung')
                                .setDescription('Beschreibung der Rechnung'),
                        ),
                ),

            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        switch (interaction.options.getSubcommand()) {
            case 'suchen':
                await this.searchInvoice(interaction);
                break;
            case 'anzeigen':
                await this.showInvoice(interaction);
                break;
            case 'bezahlen':
                await this.payInvoice(interaction);
                break;
            case 'löschen':
                await this.deleteInvoice(interaction);
                break;
            case 'erstellen':
                await this.createInvoice(interaction);
                break;
            default:
                await this.replyError('Command nicht gefunden.');
                break;
        }
    }

    private async searchInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamid = interaction.options.getString('steamid', true);
        const status = interaction.options.getString('status');

        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }

        const LIMIT_MAX = 10;
        const page = interaction.options.getInteger('page') ?? 1;
        let limit = interaction.options.getInteger('limit') ?? 5;
        if (limit > LIMIT_MAX) limit = LIMIT_MAX;
        let querystring = 'SELECT * FROM immobilling WHERE receiver_identifier = ?';
        if (status && status !== 'all') {
            querystring += ` AND status = "${status}"`;
        }
        LogManager.log(querystring);
        // Hole die Rechnungen aus der Datenbank
        const [rechnungen] = await GameDB.query<IBilling[]>(querystring, [
            vPlayer.identifiers.steam,
        ]);
        LogManager.debug(rechnungen);
        if (rechnungen.length === 0) {
            await this.replyError(
                `Es wurden keine Rechnungen gefunden\nSteamID: ${vPlayer.identifiers.steam}`,
            );
            return;
        }

        const fields = [];
        for (let i = limit * (page - 1); i < rechnungen.length; i++) {
            if (fields.length >= limit) break;
            fields.push({
                name: `Rechnung #${rechnungen[i].id}`,
                value: `Empfänger: ${rechnungen[i].receiver_name} (\`${
                    rechnungen[i].receiver_identifier
                }\`)\nSender: ${rechnungen[i].author_name} (\`${
                    rechnungen[i].author_identifier
                }\`)\nBetrag: ${rechnungen[i].invoice_value}€\nSociety: ${
                    rechnungen[i].society_name
                } (${rechnungen[i].society})\nGrund: ${rechnungen[i].item}\nNotiz: ${
                    rechnungen[i].notes
                }\nStatus: ${rechnungen[i].status}\nVersendet am: ${
                    rechnungen[i].sent_date
                }\nZahlungsziel: ${rechnungen[i].limit_pay_date ?? 'Kein Limit'}\nGebühren: ${
                    rechnungen[i].fees_amount
                }\nBezahlt am: ${rechnungen[i].paid_date ?? 'Nicht bezahlt'}`,
                inline: false,
            });
        }
        // Falls Pagination verfügbar, zeige String an
        let pageString = '';
        if (rechnungen.length > limit) {
            pageString = `\nSeite ${page}/${Math.ceil(rechnungen.length / limit)}\n${
                rechnungen.length - fields.length
            } weitere Ergebnisse sind ausgeblendet!`;
        }
        await this.replyWithEmbed({
            description: `Rechnungen für Empfänger: ${rechnungen[0].receiver_name} (${rechnungen[0].receiver_identifier}) ${pageString}`,
            fields,
        });
    }

    private async showInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const rechnungsnummer = interaction.options.getInteger('id', true);

        const [rechnungen] = await GameDB.query<IBilling[]>(
            'SELECT * FROM immobilling WHERE id = ? LIMIT 1',
            [rechnungsnummer],
        );
        LogManager.debug(rechnungen);
        if (rechnungen.length === 0) {
            await this.replyError(
                `Es wurde keine Rechnung gefunden\nRechnungsID: ${rechnungsnummer}`,
            );
            return;
        }
        // Generiere das Rückgabe-Embed
        const field = {
            name: `Rechnung #${rechnungen[0].id}`,
            value: `Empfänger: ${rechnungen[0].receiver_name} (\`${
                rechnungen[0].receiver_identifier
            }\`)\nSender: ${rechnungen[0].author_name} (\`${
                rechnungen[0].author_identifier
            }\`)\nBetrag: ${rechnungen[0].invoice_value}€\nSociety: ${
                rechnungen[0].society_name
            } (${rechnungen[0].society})\nGrund: ${rechnungen[0].item}\nNotiz: ${
                rechnungen[0].notes
            }\nStatus: ${rechnungen[0].status}\nVersendet am: ${
                rechnungen[0].sent_date
            }\nZahlungsziel: ${rechnungen[0].limit_pay_date ?? 'Kein Limit'}\nGebühren: ${
                rechnungen[0].fees_amount
            }\nBezahlt am: ${rechnungen[0].paid_date ?? 'Nicht bezahlt'}`,
            inline: false,
        };
        await this.replyWithEmbed({
            description: `RechnungsID: ${rechnungsnummer}`,
            fields: [field],
        });
    }

    private async payInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const rechnungsnummer = interaction.options.getInteger('id', true);

        const [rechnungen] = await GameDB.query<IBilling[]>(
            'SELECT * FROM immobilling WHERE id = ? LIMIT 1',
            [rechnungsnummer],
        );
        if (rechnungen.length === 0) {
            await this.replyError(
                `Es wurde keine Rechnung gefunden\nRechnungsID: ${rechnungsnummer}`,
            );
            return;
        }
        if (rechnungen[0].status !== 'unpaid') {
            await this.replyError('Die Rechnung wurde bereits bezahlt');
            return;
        }
        const now = new Date();
        const paidDate = now.toISOString().slice(0, 19).replace('T', ' ');
        await GameDB.query('UPDATE immobilling SET status = "paid", paid_date = ? WHERE id = ?', [
            paidDate,
            rechnungsnummer,
        ]);
        const embed = this.getEmbedTemplate({
            title: 'Rechnung bezahlen',
            description: `Die Rechnung #${rechnungsnummer} wurde erfolgreich durch den Support bezahlt!`,
        });

        await sendToChannel(embed, Config.Channels.PROD.S1_IMMO_BILLING);
        await interaction.reply({ embeds: [embed] });
    }

    private async deleteInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const rechnungsnummer = interaction.options.getInteger('id', true);
        const [rechnungen] = await GameDB.query<IBilling[]>(
            'SELECT * FROM immobilling WHERE id = ? LIMIT 1',
            [rechnungsnummer],
        );
        if (rechnungen.length === 0) {
            await this.replyError(
                `Es wurde keine Rechnung gefunden\nRechnungsID: ${rechnungsnummer}`,
            );
            return;
        }

        if (rechnungen[0].status !== 'unpaid') {
            await this.replyError('Die Rechnung wurde bereits bezahlt');
            return;
        }

        const [res] = await GameDB.execute<ResultSetHeader>(
            'DELETE FROM immobilling WHERE id = ?',
            [rechnungsnummer],
        );

        if (res.affectedRows === 0) {
            await this.replyError(
                `Beim löschen der Rechnung #${rechnungsnummer} ist ein Fehler aufgetreten!`,
            );
            return;
        }
        const embed = this.getEmbedTemplate({
            title: 'Rechnung löschen',
            description: `Die Rechnung #${rechnungsnummer} wurde erfolgreich durch den Support gelöscht!`,
        });
        await sendToChannel(embed, Config.Channels.PROD.S1_IMMO_BILLING);
        await interaction.reply({ embeds: [embed] });
    }

    private async createInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamid = interaction.options.getString('steamid', true);
        const betrag = interaction.options.getInteger('betrag', true);
        const grund = interaction.options.getString('grund', true);
        const beschreibung = interaction.options.getString('beschreibung') ?? '';
        let sender = interaction.options.getString('sender') ?? 'dortmund';

        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }
        if (betrag <= 0) {
            await this.replyError('Der Betrag darf nicht kleiner oder gleich 0 sein!');
            return;
        }

        let sendername = 'Stadt Dortmund';
        if (sender !== 'dortmund') {
            const [senderquery] = await GameDB.query<IJob[]>('SELECT * FROM jobs WHERE name = ?', [
                sender,
            ]);
            if (senderquery.length === 0) {
                sender = 'dortmund';
                sendername = 'Stadt Dortmund';
            } else {
                sender = senderquery[0].name;
                sendername = senderquery[0].label;
            }
        }

        const now = new Date();
        const sentDate = now.toISOString().slice(0, 19).replace('T', ' ');
        const limitPayDate = new Date();
        limitPayDate.setDate(limitPayDate.getDate() + 3);
        const limitPayDateString = limitPayDate.toISOString().slice(0, 19).replace('T', ' ');
        const [response] = await GameDB.query<IBilling[]>(
            'INSERT INTO immobilling (receiver_identifier, receiver_name, author_identifier, author_name, society, society_name, item, invoice_value, status, notes, sent_date, limit_pay_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
            [
                vPlayer.identifiers.steam,
                vPlayer.playerdata.fullname,
                'DiscordBot',
                sendername,
                `society_${sender}`,
                sendername,
                grund,
                betrag,
                'unpaid',
                beschreibung,
                sentDate,
                limitPayDateString,
            ],
        );
        const field = {
            name: `Rechnung erstellt`,
            value: `ID: ${response[0].id}\nEmpfänger: ${vPlayer.playerdata.fullname} (\`${
                vPlayer.identifiers.steam
            }\`)\nSender: ${sendername}\nBetrag: ${betrag}€\nSociety: ${sender} (${sendername})\nGrund: ${grund}\nNotiz: ${beschreibung}\nStatus: unpaid\nVersendet am: ${sentDate}\nZahlungsziel: ${
                limitPayDateString ?? 'Kein Limit'
            }`,
            inline: false,
        };
        const embed = this.getEmbedTemplate({
            title: 'Rechnung erstellen',
            description: ' ',
            fields: [field],
        });
        await sendToChannel(embed, Config.Channels.PROD.S1_IMMO_BILLING);
        await interaction.reply({ embeds: [embed] });
    }
}
