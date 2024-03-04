import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { PlayerService } from '@prism/services/PlayerService';
import { GameDB } from '@prism/sql/Database';
import { IElection } from '@prism/sql/schema/Election.schema';
import { IElectionParticipant } from '@prism/sql/schema/ElectionParticipant.schema';
import { sendToChannel } from '@prism/utils/DiscordHelper';
import { Chart, ChartConfiguration } from 'chart.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

declare module 'chartjs-plugin-datalabels' {
    interface Context {
        [key: string]: any;
    }
}

interface IVote extends RowDataPacket {
    name: string;
    vote_count: number;
}

@RegisterCommand(
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
                .addStringOption((option) => option.setName('job').setDescription('Gib den Job an'))
                .addBooleanOption((option) =>
                    option.setName('enthaltung').setDescription('Enthaltung aktivieren'),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('status')
                .setDescription('Ändert den Status einer Wahl')
                .addNumberOption((option) =>
                    option.setName('wahlid').setDescription('Gib die WahlID an').setRequired(true),
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
                    option.setName('wahlid').setDescription('Gib die WahlID an').setRequired(true),
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
                    option.setName('wahlid').setDescription('Gib die WahlID an').setRequired(true),
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
                    option.setName('wahlid').setDescription('Gib die WahlID an').setRequired(true),
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
                    option.setName('wahlid').setDescription('Gib die WahlID an').setRequired(true),
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
)
export class Wahl extends Command {
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

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        switch (interaction.options.getSubcommand()) {
            case 'erstellen':
                await this.createElection(interaction);
                break;
            case 'status':
                await this.updateStatus(interaction);
                break;
            case 'user':
                await this.manageUser(interaction);
                break;
            case 'ergebnis':
                await this.showResult(interaction);
                break;
            case 'liste':
                await this.listElections();
                break;
            case 'kandidaten':
                await this.listCandidates(interaction);
                break;
            case 'manipulieren':
                await this.manipulateElection(interaction);
                break;
            default:
                await this.replyError('Command nicht gefunden.');
                break;
        }
    }

    private async createElection(interaction: ChatInputCommandInteraction): Promise<void> {
        const name = interaction.options.getString('name', true);
        const job = interaction.options.getString('job') ?? null;
        const enthaltung = interaction.options.getBoolean('enthaltung') ?? false;

        const [queryResult] = await GameDB.query<IElection[]>(
            'INSERT INTO immo_elections (name, job, status, created, updated) VALUES (?, ?, ?, NOW(), NOW()) RETURNING *',
            [name, job ?? null, enthaltung ? 1 : 0],
        );
        const embed = this.getEmbedTemplate({
            title: 'Wahl erstellt',
            description: `Wahl ${name} erstellt!\nJob: ${job}\nEnthaltung: ${enthaltung}\nID: ${queryResult[0].id}`,
        });
        await sendToChannel(embed, Config.Channels.PROD.S1_WAHLEN);
        await interaction.reply({ embeds: [embed] });
    }

    private async updateStatus(interaction: ChatInputCommandInteraction): Promise<void> {
        const status = ['Erstellt', 'Gestartet', 'Beendet', 'Löschen'];
        const wahlid = interaction.options.getNumber('wahlid', true);
        const optionStatus = interaction.options.getNumber('option_status', true);

        const [query] = await GameDB.query<IElection[]>(
            'SELECT * FROM immo_elections WHERE id = ?',
            [wahlid],
        );
        if (!query[0]) {
            await this.replyError('Es konnte keine Wahl mit dieser ID gefunden werden!');
            return;
        }

        const [res] = await GameDB.execute<ResultSetHeader>(
            'UPDATE immo_elections SET status = ?, updated = NOW() WHERE id = ?',
            [optionStatus, wahlid],
        );

        if (res.affectedRows === 0) {
            await this.replyError('Die Wahl konnte nicht verändert werden!');
            return;
        }
        const embed = this.getEmbedTemplate({
            title: 'Wahlstatus geändert',
            description: `Wahlstatus für ${query[0].name} (${query[0].id}) auf ${
                status[optionStatus ?? 0]
            } geändert!`,
        });

        await sendToChannel(embed, Config.Channels.PROD.S1_WAHLEN);
        await interaction.reply({ embeds: [embed] });
    }

    public async manageUser(interaction: ChatInputCommandInteraction): Promise<void> {
        const wahlid = interaction.options.getNumber('wahlid', true);
        const steamid = interaction.options.getString('steamid', true);
        const operation = interaction.options.getString('operation', true);

        const [query] = await GameDB.query<IElection[]>(
            'SELECT * FROM immo_elections WHERE id = ?',
            [wahlid],
        );
        if (query[0].length === 0) {
            await this.replyError('Es konnte keine Wahl mit dieser ID gefunden werden!');
            return;
        }
        const election = query[0];
        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }

        if (operation === 'add') {
            const [response] = await GameDB.query<IElectionParticipant[]>(
                'INSERT INTO immo_elections_participants (electionid, identifier, name) VALUES (?, ?, ?) RETURNING *',
                [wahlid, vPlayer.identifiers.steam, vPlayer.playerdata.fullname],
            );

            const embed = this.getEmbedTemplate({
                title: 'Nutzer hinzugefügt',
                description: `Nutzer ${vPlayer.playerdata.fullname} zur Wahl ${election.name} (${election.id}) hinzugefügt!\nSteamID: \`${vPlayer.identifiers.steam}\`\nParticipantID: ${response[0].id}`,
            });

            await sendToChannel(embed, Config.Channels.PROD.S1_WAHLEN);
            await interaction.reply({ embeds: [embed] });
        } else if (operation === 'remove') {
            const [res] = await GameDB.execute<ResultSetHeader>(
                'DELETE FROM immo_elections_participants WHERE electionid = ? AND identifier = ?',
                [wahlid, steamid],
            );

            if (res.affectedRows === 0) {
                await this.replyError('Der Nutzer konnte nicht entfernt werden!');
                return;
            }
            const embed = this.getEmbedTemplate({
                title: 'Nutzer hinzugefügt',
                description: `Nutzer ${vPlayer.playerdata.fullname} von Wahl ${election.name} (${election.id}) entfernt!\nSteamID: \`${steamid}\``,
            });
            await sendToChannel(embed, Config.Channels.PROD.S1_WAHLEN);
            await interaction.reply({ embeds: [embed] });
        }
    }

    public async showResult(interaction: ChatInputCommandInteraction): Promise<void> {
        const wahlid = interaction.options.getNumber('wahlid', true);

        const [query] = await GameDB.query<IElection[]>(
            'SELECT * FROM immo_elections WHERE id = ?',
            [wahlid],
        );
        if (query.length === 0) {
            await this.replyError('Es konnte keine Wahl mit dieser ID gefunden werden!');
            return;
        }
        const [votes] = await GameDB.query<IVote[]>(
            'SELECT ep.name as name, COUNT(ev.id) AS vote_count FROM immo_elections_participants ep LEFT JOIN immo_elections_votes ev ON ev.participantid = ep.id AND ev.electionid = ? WHERE ep.electionid = ? GROUP BY ep.id ORDER BY vote_count DESC',
            [wahlid, wahlid],
        );

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

        await this.replyWithEmbed({
            title: 'Wahlergebnis',
            description: `Wahlergebnis für ${query[0].name} (${query[0].id})`,
        });
    }

    public async listElections(): Promise<void> {
        const status = ['Erstellt', 'Gestartet', 'Beendet', 'Löschen'];
        const [elections] = await GameDB.query<IElection[]>(
            'SELECT * FROM immo_elections WHERE status != 3',
        );
        if (elections.length === 0) {
            await this.replyError('Es konnte keine Wahlen gefunden werden!');
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
        await this.replyWithEmbed({
            title: 'Verfügbare Wahlen',
            description: 'Liste aller verfügbaren Wahlen',
            fields,
        });
    }

    public async listCandidates(interaction: ChatInputCommandInteraction): Promise<void> {
        const wahlid = interaction.options.getNumber('wahlid', true);

        const [query] = await GameDB.query<IElection[]>(
            'SELECT id, name FROM immo_elections WHERE id = ?',
            [wahlid],
        );
        if (query[0].length === 0) {
            await this.replyError('Es konnte keine Wahl mit dieser ID gefunden werden!');
            return;
        }
        const election = query[0];
        const [participants] = await GameDB.query<IElectionParticipant[]>(
            'SELECT * FROM immo_elections_participants WHERE electionid = ?',
            [wahlid],
        );
        const fields = [];
        for (const participant of participants) {
            fields.push({
                name: `${participant.name} (${participant.id})`,
                value: `ID: ${participant.id}\nSteamID: \`${participant.identifier}\``,
            });
        }
        await this.replyWithEmbed({
            title: 'Kandidaten',
            description: `Liste aller Kandidaten für ${election.name} (${election.id})`,
            fields,
        });
    }

    public async manipulateElection(interaction: ChatInputCommandInteraction): Promise<void> {
        const wahlid = interaction.options.getNumber('wahlid', true);
        const kandidatennr = interaction.options.getString('kandidatennr', true);
        const stimmen = interaction.options.getNumber('stimmen', true);
        const operation = interaction.options.getString('operation', true);

        const [query] = await GameDB.query<IElection[]>(
            'SELECT * FROM immo_elections WHERE id = ?',
            [wahlid],
        );
        if (query[0].length === 0) {
            await this.replyError('Es konnte keine Wahl mit dieser ID gefunden werden!');
            return;
        }

        const { id, name } = query[0];
        const [participant] = await GameDB.query<IElectionParticipant[]>(
            'SELECT id, name FROM immo_elections_participants WHERE id = ?',
            [kandidatennr],
        );
        if (participant[0].length === 0) {
            await this.replyError('Es konnte kein Kandidat mit dieser ID gefunden werden!');
            return;
        }
        if (operation === 'add') {
            // TODO: Umbau SQL mit RETURNING * und const [data] = await Databse.query<T> (Anmerkung: die Daten sind nicht interessant, lediglich wie viele Zeilen geändert wurden)

            let querystring =
                'INSERT INTO immo_elections_votes (electionid, identifier, participantid) VALUES ';
            const anzahl = stimmen ?? 0;
            for (let i = 0; i < anzahl; i++) {
                querystring += `(${wahlid}, "Manipulation", ${kandidatennr}),`;
            }
            const [res] = await GameDB.execute<ResultSetHeader>(querystring.slice(0, -1));
            if (res.affectedRows === 0) {
                await this.replyError('Es ist ein Fehler aufgetreten!');
                return;
            }

            const embed = this.getEmbedTemplate({
                title: 'Wahl manipuliert!',
                description: `${anzahl} Stimmen für ${participant[0].name} von Wahl ${name} (${id}) hinzugefügt!`,
            });
            await sendToChannel(embed, Config.Channels.PROD.S1_WAHLEN);
            await interaction.reply({ embeds: [embed] });
        } else if (operation === 'remove') {
            const [res] = await GameDB.execute<ResultSetHeader>(
                'DELETE FROM immo_elections_votes WHERE electionid = ? AND participantid = ? LIMIT ?',
                [wahlid, kandidatennr, stimmen],
            );

            if (res.affectedRows === 0) {
                await this.replyError('Es ist ein Fehler aufgetreten!');
                return;
            }
            const embed = this.getEmbedTemplate({
                title: 'Wahl manipuliert!',
                description: `${stimmen} Stimmen für ${participant[0].name} von Wahl ${name} (${id}) entfernt!`,
            });
            await sendToChannel(embed, Config.Channels.PROD.S1_WAHLEN);
            await interaction.reply({ embeds: [embed] });
        }
    }
}
