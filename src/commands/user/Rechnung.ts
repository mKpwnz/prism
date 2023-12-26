import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { Player } from '@controller/Player.controller';
import { EENV } from '@enums/EENV';
import Config from '@proot/Config';
import { GameDB } from '@sql/Database';
import { IBilling } from '@sql/schema/Billing.schema';
import { IJob } from '@sql/schema/Job.schema';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Rechnung extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_UNLIMITED,
        ];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
        ];
        RegisterCommand(
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
                await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true });
                break;
        }
    }

    private async searchInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        try {
            const steamid = options.getString('steamid');
            const status = options.getString('status');
            if (!steamid) {
                await interaction.reply({
                    content: 'Es wurde keine SteamID angegeben!',
                    ephemeral: true,
                });
                return;
            }

            const vPlayer = await Player.validatePlayer(steamid);
            if (!vPlayer) {
                await interaction.reply({
                    content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                    ephemeral: true,
                });
                return;
            }

            // Lege die Paginierung fest
            const LIMIT_MAX = 10;
            const page = options.getInteger('page') ?? 1;
            let limit = options.getInteger('limit') ?? 5;
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
                embed.setTitle('Rechnungsübersicht');
                embed.setDescription(
                    `Es wurden keine Rechnungen gefunden\nSteamID: ${vPlayer.identifiers.steam}`,
                );
                await interaction.reply({ embeds: [embed] });
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
            // Generiere das Embed
            embed.setTitle('Rechnungsübersicht');
            embed.setDescription(
                `Rechnungen für Empfänger: ${rechnungen[0].receiver_name} (${rechnungen[0].receiver_identifier}) ${pageString}`,
            );

            embed.setFields(fields);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }

    private async showInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        try {
            const rechnungsnummer = options.getInteger('id');
            if (!rechnungsnummer) {
                await interaction.reply({
                    content: 'Es wurde keine Rechnungsnummer angegeben!',
                    ephemeral: true,
                });
                return;
            }
            // Hole die Rechnung aus der Datenbank
            const [rechnungen] = await GameDB.query<IBilling[]>(
                'SELECT * FROM immobilling WHERE id = ? LIMIT 1',
                [rechnungsnummer],
            );
            LogManager.debug(rechnungen);
            if (rechnungen.length === 0) {
                embed.setTitle('Rechnung anzeigen');
                embed.setDescription(
                    `Es wurde keine Rechnung gefunden\nRechnungsID: ${rechnungsnummer}`,
                );
                await interaction.reply({ embeds: [embed] });
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
            // Generiere das Embed
            embed.setTitle('Rechnung anzeigen');
            embed.setDescription(`RechnungsID: ${rechnungsnummer}`);
            embed.setFields([field]);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({
                content: 'Es ist ein Datenbankfehler aufgetreten!',
                ephemeral: true,
            });
        }
    }

    private async payInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        try {
            const rechnungsnummer = options.getInteger('id');
            if (!rechnungsnummer) {
                await interaction.reply({
                    content: 'Es wurde keine Rechnungsnummer angegeben!',
                    ephemeral: true,
                });
                return;
            }
            const [rechnungen] = await GameDB.query<IBilling[]>(
                'SELECT * FROM immobilling WHERE id = ? LIMIT 1',
                [rechnungsnummer],
            );
            if (rechnungen.length === 0) {
                embed.setTitle('Rechnung bezahlen');
                embed.setDescription(
                    `Es wurde keine Rechnung gefunden\nRechnungsID: ${rechnungsnummer}`,
                );
                await interaction.reply({ embeds: [embed] });
                return;
            }
            if (rechnungen[0].status !== 'unpaid') {
                embed.setTitle('Rechnung bezahlen');
                embed.setDescription('Die Rechnung wurde bereits bezahlt');
                await interaction.reply({ embeds: [embed] });
                return;
            }
            const now = new Date();
            const paidDate = now.toISOString().slice(0, 19).replace('T', ' ');
            await GameDB.query(
                'UPDATE immobilling SET status = "paid", paid_date = ? WHERE id = ?',
                [paidDate, rechnungsnummer],
            );
            embed.setTitle('Rechnung bezahlen');
            embed.setDescription('Die Rechnung wurde erfolgreich bezahlt');
            const channel = await interaction.guild?.channels.fetch(
                Config.Discord.LogChannel.S1_IMMO_BILLING,
            );
            if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }

    private async deleteInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        try {
            const rechnungsnummer = options.getInteger('id');
            if (!rechnungsnummer) {
                await interaction.reply({
                    content: 'Es wurde keine Rechnungsnummer angegeben!',
                    ephemeral: true,
                });
                return;
            }
            const [rechnungen] = await GameDB.query<IBilling[]>(
                'SELECT * FROM immobilling WHERE id = ? LIMIT 1',
                [rechnungsnummer],
            );
            if (rechnungen.length === 0) {
                embed.setTitle('Rechnung löschen');
                embed.setDescription(
                    `Es wurde keine Rechnung gefunden\nRechnungsID: ${rechnungsnummer}`,
                );
                await interaction.reply({ embeds: [embed] });
                return;
            }
            if (rechnungen[0].status !== 'unpaid') {
                embed.setTitle('Rechnung löschen');
                embed.setDescription('Die Rechnung wurde bereits bezahlt');
                await interaction.reply({ embeds: [embed] });
                return;
            }
            await GameDB.query('DELETE FROM immobilling WHERE id = ?', [rechnungsnummer]);
            embed.setTitle('Rechnung löschen');
            embed.setDescription('Die Rechnung wurde erfolgreich gelöscht');
            const channel = await interaction.guild?.channels.fetch(
                Config.Discord.LogChannel.S1_IMMO_BILLING,
            );
            if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }

    private async createInvoice(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        const steamid = options.getString('steamid');
        if (!steamid) {
            await interaction.reply({
                content: 'Es wurde keine SteamID angegeben!',
                ephemeral: true,
            });
            return;
        }
        const vPlayer = await Player.validatePlayer(steamid);
        if (!vPlayer) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            });
            return;
        }
        const betrag = options.getInteger('betrag');
        if (!betrag) {
            await interaction.reply({
                content: 'Es wurde kein Betrag angegeben!',
                ephemeral: true,
            });
            return;
        }
        if (betrag === 0) {
            await interaction.reply({ content: 'Der Betrag darf nicht 0 sein!', ephemeral: true });
            return;
        }
        if (betrag < 0) {
            await interaction.reply({
                content: 'Der Betrag darf nicht negativ sein!',
                ephemeral: true,
            });
            return;
        }
        const grund = options.getString('grund') ?? '';
        let sender = options.getString('sender') ?? 'dortmund';
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

        const beschreibung = options.getString('beschreibung') ?? '';
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
        embed.setTitle('Rechnung erstellen');
        embed.setFields([field]);
        const channel = await interaction.guild?.channels.fetch(
            Config.Discord.LogChannel.S1_IMMO_BILLING,
        );
        if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
        await interaction.reply({ embeds: [embed] });
    }
}
