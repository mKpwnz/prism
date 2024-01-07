import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import { IElection } from '@sql/schema/Election.schema';
import { IElectionParticipant } from '@sql/schema/ElectionParticipant.schema';
import LogManager from '@utils/Logger';
import { Chart, ChartConfiguration } from 'chart.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { RowDataPacket } from 'mysql2';

declare module 'chartjs-plugin-datalabels' {
    interface Context {
        [key: string]: any;
    }
}

interface IVote extends RowDataPacket {
    name: string;
    vote_count: number;
}

export class Wahl extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_LIMITED,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,

            Config.Groups.DEV.BOTTEST,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('wahl')
                .setDescription('Wahlverwaltung!')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('erstellen')
                        .setDescription('Erstellt eine Wahl')
                        .addStringOption((option) =>
                            option
                                .setName('name')
                                .setDescription('Gib der Wahl einen Namen')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option.setName('job').setDescription('Gib den Job an'),
                        )
                        .addBooleanOption((option) =>
                            option.setName('enthaltung').setDescription('Enthaltung aktivieren'),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('status')
                        .setDescription('Ändert den Status einer Wahl')
                        .addNumberOption((option) =>
                            option
                                .setName('wahlid')
                                .setDescription('Gib die WahlID an')
                                .setRequired(true),
                        )
                        .addNumberOption((option) =>
                            option
                                .setName('option_status')
                                .setDescription('Status der Wahl')
                                .addChoices(
                                    { name: 'Erstellt', value: 0 },
                                    { name: 'Gestartet', value: 1 },
                                    { name: 'Beendet', value: 2 },
                                    { name: 'Löschen', value: 3 },
                                )
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('user')
                        .setDescription('Einstellungen zum User')
                        .addStringOption((option) =>
                            option
                                .setName('operation')
                                .setDescription('hinzufügen/entfernen eines Spielers zur Wahl')
                                .addChoices(
                                    { name: 'hinzufügen', value: 'add' },
                                    { name: 'entfernen', value: 'remove' },
                                )
                                .setRequired(true),
                        )
                        .addNumberOption((option) =>
                            option
                                .setName('wahlid')
                                .setDescription('Gib die WahlID an')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('steamid')
                                .setDescription('Gib die SteamID an')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('ergebnis')
                        .setDescription('Zeigt das Wahlergebnis an')
                        .addNumberOption((option) =>
                            option
                                .setName('wahlid')
                                .setDescription('Gib die WahlID an')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand.setName('liste').setDescription('Zeigt alle offenen Wahlen an'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('kandidaten')
                        .setDescription('Zeigt alle Kandidaten zu einer Wahl an')
                        .addNumberOption((option) =>
                            option
                                .setName('wahlid')
                                .setDescription('Gib die WahlID an')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('manipulieren')
                        .setDescription('Manipuliert eine Wahl')
                        .addStringOption((option) =>
                            option
                                .setName('operation')
                                .setDescription('hinzufügen/entfernen von Stimmen')
                                .addChoices(
                                    { name: 'hinzufügen', value: 'add' },
                                    { name: 'entfernen', value: 'remove' },
                                )
                                .setRequired(true),
                        )
                        .addNumberOption((option) =>
                            option
                                .setName('wahlid')
                                .setDescription('Gib die WahlID an')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('kandidatennr')
                                .setDescription(
                                    'Gib die Kandidatennummer an, diese findest du bei /wahl kandidaten',
                                )
                                .setRequired(true),
                        )
                        .addNumberOption((option) =>
                            option
                                .setName('stimmen')
                                .setDescription('Gib die Anzahl der Stimmen an an')
                                .setRequired(true),
                        ),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        switch (interaction.options.getSubcommand()) {
            case 'erstellen':
                await this.createElection(interaction);
                break;
            case 'status':
                await this.showStatus(interaction);
                break;
            case 'user':
                await this.manageUser(interaction);
                break;
            case 'ergebnis':
                await this.showResult(interaction);
                break;
            case 'liste':
                await this.listElections(interaction);
                break;
            case 'kandidaten':
                await this.listCandidates(interaction);
                break;
            case 'manipulieren':
                await this.manipulateElection(interaction);
                break;
            default:
                await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true });
                break;
        }
    }

    private async createElection(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        if (options.getString('name') === '') {
            await interaction.reply({ content: 'Bitte gib einen Namen an!', ephemeral: true });
            return;
        }
        try {
            const [queryResult] = await GameDB.query<IElection[]>(
                'INSERT INTO immo_elections (name, job, status, created, updated) VALUES (?, ?, ?, NOW(), NOW()) RETURNING *',
                [
                    options.getString('name'),
                    options.getString('job') ?? null,
                    options.getBoolean('enthaltung') ? 1 : 0,
                ],
            );
            embed.setTitle('Wahl erstellt');
            embed.setDescription(
                `Wahl ${options.getString('name')} erstellt!\nJob: ${options.getString(
                    'job',
                )}\nEnthaltung: ${options.getBoolean('enthaltung')}\nID: ${queryResult[0].id}`,
            );
            const channel = await interaction.guild?.channels.fetch(Config.Channels.PROD.S1_WAHLEN);
            if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }

    private async showStatus(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        const status = ['Erstellt', 'Gestartet', 'Beendet', 'Löschen'];
        try {
            if (options.getNumber('wahlid') === 0) {
                await interaction.reply({ content: 'Bitte gib eine WahlID an!', ephemeral: true });
                return;
            }
            const [query] = await GameDB.query<IElection[]>(
                'SELECT * FROM immo_elections WHERE id = ?',
                [options.getNumber('wahlid')],
            );
            if (!query[0]) {
                await interaction.reply({
                    content: 'Es konnte keine Wahl mit dieser ID gefunden werden!',
                    ephemeral: true,
                });
                return;
            }
            // TODO: Umbauen von "as RowDataPacket[]" aut Database.query<T>
            const response = (await GameDB.query(
                'UPDATE immo_elections SET status = ?, updated = NOW() WHERE id = ?',
                [options.getNumber('option_status'), options.getNumber('wahlid')],
            )) as RowDataPacket[];
            if (response[0].rowsChanged === 0) {
                await interaction.reply({
                    content: 'Die Wahl konnte nicht verändert werden!',
                    ephemeral: true,
                });
                return;
            }
            embed.setTitle('Wahlstatus geändert');
            embed.setDescription(
                `Wahlstatus für ${query[0].name} (${query[0].id}) auf ${
                    status[options.getNumber('option_status') ?? 0]
                } geändert!`,
            );
            const channel = await interaction.guild?.channels.fetch(Config.Channels.PROD.S1_WAHLEN);
            if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }

    public async manageUser(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        if (
            options.getNumber('wahlid') === 0 ||
            options.getString('steamid') === '' ||
            options.getString('operation') === ''
        ) {
            await interaction.reply({
                content: 'Bitte gib eine WahlID/SteamID/Operation an!',
                ephemeral: true,
            });
            return;
        }
        const [query] = await GameDB.query<IElection[]>(
            'SELECT * FROM immo_elections WHERE id = ?',
            [options.getNumber('wahlid')],
        );
        if (query[0].length === 0) {
            await interaction.reply({
                content: 'Es konnte keine Wahl mit dieser ID gefunden werden!',
                ephemeral: true,
            });
            return;
        }
        const election = query[0];
        const vPlayer = await PlayerService.validatePlayer(options.getString('steamid') ?? '');
        if (!vPlayer) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            });
            return;
        }
        if (options.getString('operation') === 'add') {
            const [response] = await GameDB.query<IElectionParticipant[]>(
                'INSERT INTO immo_elections_participants (electionid, identifier, name) VALUES (?, ?, ?) RETURNING *',
                [
                    options.getNumber('wahlid'),
                    vPlayer.identifiers.steam,
                    vPlayer.playerdata.fullname,
                ],
            );
            embed.setTitle('Nutzer hinzugefügt');
            embed.setDescription(
                `Nutzer ${vPlayer.playerdata.fullname} zur Wahl ${election.name} (${election.id}) hinzugefügt!\nSteamID: \`${vPlayer.identifiers.steam}\`\nParticipantID: ${response[0].id}`,
            );
            const channel = await interaction.guild?.channels.fetch(Config.Channels.PROD.S1_WAHLEN);
            if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
            await interaction.reply({ embeds: [embed] });
        } else if (options.getString('operation') === 'remove') {
            try {
                let steamid = options.getString('steamid') ?? '';
                if (!steamid.startsWith('steam:')) steamid = `steam:${steamid}`;
                // TODO: Auswertung "affected rows" einfügen
                const res = await GameDB.query<RowDataPacket[][]>(
                    'DELETE FROM immo_elections_participants WHERE electionid = ? AND identifier = ?',
                    [options.getNumber('wahlid'), steamid],
                );
                LogManager.debug(res);
                embed.setTitle('Nutzer hinzugefügt');
                embed.setDescription(
                    `Nutzer ${vPlayer.playerdata.fullname} von Wahl ${election.name} (${election.id}) entfernt!\nSteamID: \`${steamid}\``,
                );
                const channel = await interaction.guild?.channels.fetch(
                    Config.Channels.PROD.S1_WAHLEN,
                );
                if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                LogManager.error(error);
                await interaction.reply({
                    content: 'Es ist ein Fehler aufgetreten!',
                    ephemeral: true,
                });
            }
        }
    }

    public async showResult(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        try {
            const [query] = await GameDB.query<IElection[]>(
                'SELECT * FROM immo_elections WHERE id = ?',
                [options.getNumber('wahlid')],
            );
            if (query.length === 0) {
                await interaction.reply({
                    content: 'Es konnte keine Wahl mit dieser ID gefunden werden!',
                    ephemeral: true,
                });
                return;
            }
            const [votes] = await GameDB.query<IVote[]>(
                'SELECT ep.name as name, COUNT(ev.id) AS vote_count FROM immo_elections_participants ep LEFT JOIN immo_elections_votes ev ON ev.participantid = ep.id AND ev.electionid = ? WHERE ep.electionid = ? GROUP BY ep.id ORDER BY vote_count DESC',
                [options.getNumber('wahlid'), options.getNumber('wahlid')],
            );
            // Change the Query to a graph created with Chart.js and send it to the channel
            const width = 800;
            const height = 500;
            const chart = new ChartJSNodeCanvas({
                width,
                height,
                backgroundColour: '#17171c',
                chartCallback: (ChartJS) => {
                    ChartJS.defaults.font.family = 'TT Norms Pro';
                },
            });
            chart.registerFont('src/assets/fonts/TTNormsPro-Regular.ttf', {
                family: 'TT Norms Pro',
            });
            Chart.register(ChartDataLabels);
            const labels = votes.map((vote) => `${vote.name} (${vote.vote_count})`);
            const data = votes.map((vote) => vote.vote_count);
            const config: ChartConfiguration = {
                type: 'doughnut',
                plugins: [ChartDataLabels], // EDIT: Hierhin verschoben um Typescript Fehler zu vermeiden. Muss getestet werden
                data: {
                    // plugins: [ChartDataLabels],
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor: [
                                '#118f50',
                                '#e5a500',
                                '#af1310',
                                '#e74206',
                                '#7ccc04',
                                '#04a0cb',
                                '#3619f7',
                                '#c70af7',
                                '#ec054c',
                                '#1ad778',
                                '#ffd158',
                                '#ec3633',
                                '#fb9068',
                                '#fcdf3c',
                                '#affc3c',
                                '#3cd2fb',
                                '#a89cfc',
                                '#e387fb',
                                '#fc6e9a',
                            ],
                            borderColor: '#17171c',
                            borderWidth: 5,
                        },
                    ],
                },
                options: {
                    layout: {
                        padding: 30,
                    },
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                // display: true, // Gibt es nach ChartConfiguration nicht
                                color: 'white',
                                font: {
                                    size: 25,
                                },
                            },
                        },
                        title: {
                            display: true,
                            text: query[0].name,
                            color: 'white',
                            font: {
                                size: 30,
                            },
                            padding: {
                                top: 10,
                                bottom: 30,
                            },
                        },
                        datalabels: {
                            display: true,
                            color: 'white',
                            font: {
                                size: 25,
                            },
                            formatter: (value: number, ctx: Context) => {
                                const index = ctx.dataIndex;
                                // if there is not enough space, skip
                                const percentage =
                                    (data[index] / data.reduce((acc, val) => acc + val, 0)) * 100;
                                if (percentage < 5) return '';
                                return `${percentage.toFixed(0)}%`;
                            },
                        },
                    },
                },
            };
            const image = await chart.renderToBuffer(config);
            if (interaction.channel && interaction.channel.isTextBased())
                await interaction.channel.send({ files: [image] });
            embed.setTitle('Wahlergebnis');
            embed.setDescription(`Wahlergebnis für ${query[0].name} (${query[0].id})`);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }

    public async listElections(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = Command.getEmbedTemplate(interaction);
        const status = ['Erstellt', 'Gestartet', 'Beendet', 'Löschen'];
        try {
            const [elections] = await GameDB.query<IElection[]>(
                'SELECT * FROM immo_elections WHERE status != 3',
            );
            if (elections.length === 0) {
                await interaction.reply('Es konnte keine Wahlen gefunden werden!');
                return;
            }
            const fields = [];
            for (const election of elections) {
                fields.push({
                    name: `${election.name} (${election.id})`,
                    value: `Status: ${status[election.status]}\nJobs: ${
                        election.job
                    }\nErstellt: ${election.created.toLocaleDateString()} ${election.created.toLocaleTimeString()}\nAktualisiert: ${election.updated.toLocaleDateString()} ${election.updated.toLocaleTimeString()}`,
                });
            }
            embed.setTitle('Verfügbare Wahlen');
            embed.setDescription('Liste aller verfügbaren Wahlen');
            embed.setFields(fields);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }

    public async listCandidates(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        try {
            const [query] = await GameDB.query<IElection[]>(
                'SELECT id, name FROM immo_elections WHERE id = ?',
                [options.getNumber('wahlid')],
            );
            if (query[0].length === 0) {
                await interaction.reply('Es konnte keine Wahl mit dieser ID gefunden werden!');
                return;
            }
            const election = query[0];
            const [participants] = await GameDB.query<IElectionParticipant[]>(
                'SELECT * FROM immo_elections_participants WHERE electionid = ?',
                [options.getNumber('wahlid')],
            );
            const fields = [];
            for (const participant of participants) {
                fields.push({
                    name: `${participant.name} (${participant.id})`,
                    value: `ID: ${participant.id}\nSteamID: \`${participant.identifier}\``,
                });
            }
            embed.setTitle('Kandidaten');
            embed.setDescription(`Liste aller Kandidaten für ${election.name} (${election.id})`);
            embed.setFields(fields);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }

    public async manipulateElection(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);
        try {
            if (
                options.getNumber('wahlid') === 0 ||
                options.getString('kandidatennr') === '' ||
                options.getNumber('stimmen') === 0 ||
                options.getString('operation') === ''
            ) {
                await interaction.reply({
                    content: 'Deine Angaben sind nicht vollständig!',
                    ephemeral: true,
                });
                return;
            }
            const [query] = await GameDB.query<IElection[]>(
                'SELECT * FROM immo_elections WHERE id = ?',
                [options.getNumber('wahlid')],
            );
            if (query[0].length === 0) {
                await interaction.reply({
                    content: 'Es konnte keine Wahl mit dieser ID gefunden werden!',
                    ephemeral: true,
                });
                return;
            }
            const { id, name } = query[0];
            const [participant] = await GameDB.query<IElectionParticipant[]>(
                'SELECT id, name FROM immo_elections_participants WHERE id = ?',
                [options.getString('kandidatennr')],
            );
            if (participant[0].length === 0) {
                await interaction.reply({
                    content: 'Es konnte kein Kandidat mit dieser ID gefunden werden!',
                    ephemeral: true,
                });
                return;
            }
            if (options.getString('operation') === 'add') {
                // TODO: Umbau SQL mit RETURNING * und const [data] = await Databse.query<T> (Anmerkung: die Daten sind nicht interessant, lediglich wie viele Zeilen geändert wurden)
                let querystring =
                    'INSERT INTO immo_elections_votes (electionid, identifier, participantid) VALUES ';
                const anzahl = options.getNumber('stimmen') ?? 0;
                for (let i = 0; i < anzahl; i++) {
                    querystring += `(${options.getNumber(
                        'wahlid',
                    )}, "Manipulation", ${options.getString('kandidatennr')}),`;
                }
                const response = await GameDB.query<RowDataPacket[][]>(querystring.slice(0, -1));
                LogManager.debug(response);
                embed.setTitle('Wahl manipuliert!');
                embed.setDescription(
                    `${anzahl} Stimmen für ${participant[0].name} von Wahl ${name} (${id}) hinzugefügt!`,
                );
                // const channel = await interaction.guild?.channels.fetch(Config.Channels.PROD.S1_WAHLEN);
                // if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] })
                await interaction.reply({ embeds: [embed] });
            } else if (options.getString('operation') === 'remove') {
                // TODO: Umbau auf neue Query Struktur
                const response = await GameDB.query<RowDataPacket[][]>(
                    'DELETE FROM immo_elections_votes WHERE electionid = ? AND participantid = ? LIMIT ?',
                    [
                        options.getNumber('wahlid'),
                        options.getString('kandidatennr'),
                        options.getNumber('stimmen'),
                    ],
                );
                LogManager.debug(response);
                embed.setTitle('Wahl manipuliert!');
                embed.setDescription(
                    `${options.getNumber('stimmen')} Stimmen für ${
                        participant[0].name
                    } von Wahl ${name} (${id}) entfernt!`,
                );
                const channel = await interaction.guild?.channels.fetch(
                    Config.Channels.PROD.S1_WAHLEN,
                );
                if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }
}
