import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EmbedBuilder } from '@discordjs/builders'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { IElection } from '@sql/schema/Election.schema'
import { IElectionParticipant } from '@sql/schema/ElectionParticipant.schema'
import LogManager from '@utils/Logger'
import { Chart, ChartConfiguration } from 'chart.js'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'
import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder, TextChannel } from 'discord.js'
import { RowDataPacket } from 'mysql2'
import { WhoIs } from '../user/WhoIs'
import { EENV } from '@enums/EENV'

declare module 'chartjs-plugin-datalabels' {
    interface Context {
        [key: string]: any
    }
}

export class Wahl extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_BOTTESTER]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('wahl')
                .setDescription('Wahlverwaltung!')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('erstellen')
                        .setDescription('Erstellt eine Wahl')
                        .addStringOption((option) =>
                            option.setName('name').setDescription('Gib der Wahl einen Namen').setRequired(true),
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
                            option.setName('steamid').setDescription('Gib die SteamID an').setRequired(true),
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
                                .setDescription('Gib die Kandidatennummer an, diese findest du bei /wahl kandidaten')
                                .setRequired(true),
                        )
                        .addNumberOption((option) =>
                            option
                                .setName('stimmen')
                                .setDescription('Gib die Anzahl der Stimmen an an')
                                .setRequired(true),
                        ),
                ) as SlashCommandBuilder,
            this,
        )
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return
        const status = ['Erstellt', 'Gestartet', 'Beendet', 'Löschen']
        if (this.CommandEmbed === null) this.CommandEmbed = this.updateEmbed(interaction)
        let embed = this.CommandEmbed
        const options = interaction.options as CommandInteractionOptionResolver

        switch (options.getSubcommand()) {
            case 'erstellen':
                await this.createElection(embed, interaction, options)
                break
            case 'status':
                await this.showStatus(embed, interaction, options)
                break
            case 'user':
                await this.manageUser(embed, interaction, options)
                break
            case 'ergebnis':
                await this.showResult(embed, interaction, options)
                break
            case 'liste':
                await this.listElections(embed, interaction, options)
                break
            case 'kandidaten':
                await this.listCandidates(embed, interaction, options)
                break
            case 'manipulieren':
                await this.manipulateElection(embed, interaction, options)
                break
            default:
                await interaction.reply({ content: 'Dieser Befehl existiert nicht!', ephemeral: true })
                break
        }
    }
    private async createElection(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        if (options.getString('name') === '') {
            await interaction.reply('Bitte gib einen Namen an!')
            return
        }
        try {
            var [queryResult] = await Database.query<IElection[]>(
                'INSERT INTO immo_elections (name, job, status, created, updated) VALUES (?, ?, ?, NOW(), NOW()) RETURNING *',
                [options.getString('name'), options.getString('job') ?? null, options.getBoolean('enthaltung') ? 1 : 0],
            )
            embed.setTitle('Wahl erstellt')
            embed.setDescription(
                'Wahl ' +
                    options.getString('name') +
                    ' erstellt!\nJob: ' +
                    options.getString('job') +
                    '\nEnthaltung: ' +
                    options.getBoolean('enthaltung') +
                    '\nID: ' +
                    queryResult[0].id,
            )
            const channel = (await interaction.guild?.channels.fetch(
                Config.Discord.LogChannel.S1_WAHLEN,
            )) as TextChannel
            await channel?.send({ embeds: [embed] })
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            LogManager.error(error)
            await interaction.reply('Es ist ein Fehler aufgetreten!')
        }
    }

    private async showStatus(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        try {
            if (options.getNumber('wahlid') === 0) {
                await interaction.reply('Bitte gib eine WahlID an!')
                return
            }
            let query = await Database.query<RowDataPacket[]>('SELECT * FROM immo_elections WHERE id = ?', [
                options.getNumber('wahlid'),
            ])
            if (query[0].length === 0) {
                await interaction.reply('Es konnte keine Wahl mit dieser ID gefunden werden!')
                return
            }
            let [response] = await Database.query<IElection[]>(
                'UPDATE immo_elections SET status = ?, updated = NOW() WHERE id = ? RETURNING *',
                [options.getNumber('option_status'), options.getNumber('wahlid')],
            )
            embed.setTitle('Wahlstatus geändert')
            embed.setDescription(
                'Wahlstatus für ' +
                    response[0].name +
                    ' (' +
                    response[0].id +
                    ')' +
                    ' auf ' +
                    status[options.getNumber('option_status') ?? 0] +
                    ' geändert!',
            )
            const channel = (await interaction.guild?.channels.fetch(
                Config.Discord.LogChannel.S1_WAHLEN,
            )) as TextChannel
            await channel?.send({ embeds: [embed] })
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            LogManager.error(error)
            await interaction.reply('Es ist ein Fehler aufgetreten!')
        }
    }

    public async manageUser(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        if (
            options.getNumber('wahlid') === 0 ||
            options.getString('steamid') === '' ||
            options.getString('operation') === ''
        ) {
            await interaction.reply('Bitte gib eine WahlID/SteamID/Operation an!')
            return
        }
        let [query] = await Database.query<IElection[]>('SELECT * FROM immo_elections WHERE id = ?', [
            options.getNumber('wahlid'),
        ])
        if (query[0].length === 0) {
            await interaction.reply('Es konnte keine Wahl mit dieser ID gefunden werden!')
            return
        }
        let election = query[0]
        const vUser = await WhoIs.validateUser(options.getString('steamid') ?? '')
        if (!vUser) {
            await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!')
            return
        }
        if (options.getString('operation') === 'add') {
            let [response] = await Database.query<IElectionParticipant[]>(
                'INSERT INTO immo_elections_participants (electionid, identifier, name) VALUES (?, ?, ?) RETURNING *',
                [options.getNumber('wahlid'), vUser.identifier, vUser.firstname + ' ' + vUser.lastname],
            )
            embed.setTitle('Nutzer hinzugefügt')
            embed.setDescription(
                'Nutzer ' +
                    vUser.firstname +
                    ' ' +
                    vUser.lastname +
                    ' zur Wahl ' +
                    election.name +
                    ' (' +
                    election.id +
                    ') hinzugefügt!\nSteamID: `' +
                    vUser.identifier +
                    '`\nParticipantID: ' +
                    response[0].id,
            )
            const channel = (await interaction.guild?.channels.fetch(
                Config.Discord.LogChannel.S1_WAHLEN,
            )) as TextChannel
            await channel?.send({ embeds: [embed] })
            await interaction.reply({ embeds: [embed] })
        } else if (options.getString('operation') === 'remove') {
            try {
                let steamid = options.getString('steamid') ?? ''
                if (!steamid.startsWith('steam:')) steamid = 'steam:' + steamid
                await Database.query<RowDataPacket[][]>(
                    'DELETE FROM immo_elections_participants WHERE electionid = ? AND identifier = ?',
                    [options.getNumber('wahlid'), steamid],
                )
                embed.setTitle('Nutzer hinzugefügt')
                embed.setDescription(
                    'Nutzer ' +
                        vUser.firstname +
                        ' ' +
                        vUser.lastname +
                        ' von Wahl ' +
                        election.name +
                        ' (' +
                        election.id +
                        ') entfernt!\nSteamID: `' +
                        steamid +
                        '`',
                )
                const channel = (await interaction.guild?.channels.fetch(
                    Config.Discord.LogChannel.S1_WAHLEN,
                )) as TextChannel
                await channel?.send({ embeds: [embed] })
                await interaction.reply({ embeds: [embed] })
            } catch (error) {
                LogManager.error(error)
                await interaction.reply('Es ist ein Fehler aufgetreten!')
            }
        }
    }

    public async showResult(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        try {
            let [query] = await Database.query<IElection[]>('SELECT * FROM immo_elections WHERE id = ?', [
                options.getNumber('wahlid'),
            ])
            if (query.length === 0) {
                await interaction.reply('Es konnte keine Wahl mit dieser ID gefunden werden!')
                return
            }
            interface IVote extends RowDataPacket {
                name: string
                vote_count: number
            }
            let [votes] = await Database.query<IVote[]>(
                'SELECT ep.name as name, COUNT(ev.id) AS vote_count ' +
                    'FROM immo_elections_participants ep ' +
                    'LEFT JOIN immo_elections_votes ev ON ev.participantid = ep.id AND ev.electionid = ? ' +
                    'WHERE ep.electionid = ? GROUP BY ep.id ORDER BY vote_count DESC',
                [options.getNumber('wahlid'), options.getNumber('wahlid')],
            )
            // Change the Query to a graph created with Chart.js and send it to the channel
            const width = 800
            const height = 500
            const chart = new ChartJSNodeCanvas({
                width,
                height,
                backgroundColour: '#17171c',
                chartCallback: (ChartJS) => {
                    ChartJS.defaults.font.family = 'TT Norms Pro'
                },
            })
            chart.registerFont('src/assets/fonts/TTNormsPro-Regular.ttf', {
                family: 'TT Norms Pro',
            })
            Chart.register(ChartDataLabels)
            const labels = votes.map((vote) => vote.name + ' (' + vote.vote_count + ')')
            const data = votes.map((vote) => vote.vote_count)
            const config = {
                type: 'doughnut',
                data: {
                    plugins: [ChartDataLabels],
                    labels: labels,
                    datasets: [
                        {
                            data: data,
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
                                display: true,
                                color: 'white',
                                font: {
                                    size: 25,
                                },
                            },
                        },
                        title: {
                            display: true,
                            text: name,
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
                                const index = ctx.dataIndex
                                // if there is not enough space, skip
                                const percentage = (data[index] / data.reduce((acc, val) => acc + val, 0)) * 100
                                if (percentage < 5) return ''

                                return `${percentage.toFixed(0)}%`
                            },
                        },
                    },
                },
            } as ChartConfiguration
            const image = await chart.renderToBuffer(config)

            interaction.channel?.send({ files: [image] })

            embed.setTitle('Wahlergebnis')
            embed.setDescription('Wahlergebnis für ' + query[0].name + ' (' + query[0].id + ')')
            //post image to channel

            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            LogManager.error(error)
            await interaction.reply('Es ist ein Fehler aufgetreten!')
        }
    }

    public async listElections(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        try {
            let [elections] = await Database.query<IElection[]>('SELECT * FROM immo_elections WHERE status != 3')
            if (elections.length === 0) {
                await interaction.reply('Es konnte keine Wahlen gefunden werden!')
                return
            }
            let fields = []
            for (const election of elections) {
                fields.push({
                    name: election.name + ' (' + election.id + ')',
                    value:
                        'Status: ' +
                        status[election.status] +
                        '\nJobs: ' +
                        election.job +
                        '\nErstellt: ' +
                        election.created.toLocaleDateString() +
                        ' ' +
                        election.updated.toLocaleTimeString() +
                        '\nAktualisiert: ' +
                        election.updated.toLocaleDateString() +
                        ' ' +
                        election.updated.toLocaleTimeString(),
                })
            }
            embed.setTitle('Verfügbare Wahlen')
            embed.setDescription('Liste aller verfügbaren Wahlen')
            embed.setFields(fields)
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            LogManager.error(error)
            await interaction.reply('Es ist ein Fehler aufgetreten!')
        }
    }

    public async listCandidates(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        try {
            let [query] = await Database.query<IElection[]>('SELECT id, name FROM immo_elections WHERE id = ?', [
                options.getNumber('wahlid'),
            ])
            if (query[0].length === 0) {
                await interaction.reply('Es konnte keine Wahl mit dieser ID gefunden werden!')
                return
            }
            let election = query[0]

            let [participants] = await Database.query<IElectionParticipant[]>(
                'SELECT * FROM immo_elections_participants WHERE electionid = ?',
                [options.getNumber('wahlid')],
            )
            let fields = []
            for (const participant of participants) {
                fields.push({
                    name: participant.name + ' (' + participant.id + ')',
                    value: 'ID: ' + participant.id + '\nSteamID: `' + participant.identifier + '`',
                })
            }
            embed.setTitle('Kandidaten')
            embed.setDescription('Liste aller Kandidaten für ' + election.name + ' (' + election.id + ')')
            embed.setFields(fields)
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            LogManager.error(error)
            await interaction.reply('Es ist ein Fehler aufgetreten!')
        }
    }

    public async manipulateElection(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        try {
            if (
                options.getNumber('wahlid') === 0 ||
                options.getString('kandidatennr') === '' ||
                options.getNumber('stimmen') === 0 ||
                options.getString('operation') === ''
            ) {
                await interaction.reply({ content: 'Deine Angaben sind nicht vollständig!', ephemeral: true })
                return
            }
            let [query] = await Database.query<IElection[]>('SELECT * FROM immo_elections WHERE id = ?', [
                options.getNumber('wahlid'),
            ])
            if (query[0].length === 0) {
                await interaction.reply('Es konnte keine Wahl mit dieser ID gefunden werden!')
                return
            }
            let { id, name } = query[0]
            let [participant] = await Database.query<IElectionParticipant[]>(
                'SELECT id, name FROM immo_elections_participants WHERE id = ?',
                [options.getString('kandidatennr')],
            )
            if (participant[0].length === 0) {
                await interaction.reply('Es konnte kein Kandidat mit dieser ID gefunden werden!')
                return
            }
            if (options.getString('operation') === 'add') {
                let querystring = 'INSERT INTO immo_elections_votes (electionid, identifier, participantid) VALUES '
                let anzahl = options.getNumber('stimmen') ?? 0
                for (let i = 0; i < anzahl; i++) {
                    querystring +=
                        '(' +
                        options.getNumber('wahlid') +
                        ', "Manipulation", ' +
                        options.getString('kandidatennr') +
                        '),'
                }
                let response = await Database.query<RowDataPacket[][]>(querystring.slice(0, -1))
                LogManager.debug(response)
                embed.setTitle('Wahl manipuliert!')
                embed.setDescription(
                    anzahl + ' Stimmen für ' + participant[0].name + ' zur Wahl ' + name + ' (' + id + ') hinzugefügt!',
                )
                const channel = (await interaction.guild?.channels.fetch(
                    Config.Discord.LogChannel.S1_WAHLEN,
                )) as TextChannel
                await channel?.send({ embeds: [embed] })
                await interaction.reply({ embeds: [embed] })
            } else if (options.getString('operation') === 'remove') {
                let response = await Database.query<RowDataPacket[][]>(
                    'DELETE FROM immo_elections_votes WHERE electionid = ? AND participantid = ? LIMIT ?',
                    [options.getNumber('wahlid'), options.getString('kandidatennr'), options.getNumber('stimmen')],
                )
                LogManager.debug(response)
                embed.setTitle('Wahl manipuliert!')
                embed.setDescription(
                    options.getNumber('stimmen') +
                        ' Stimmen für ' +
                        participant[0].name +
                        ' von Wahl ' +
                        name +
                        ' (' +
                        id +
                        ') entfernt!',
                )
                const channel = (await interaction.guild?.channels.fetch(
                    Config.Discord.LogChannel.S1_WAHLEN,
                )) as TextChannel
                await channel?.send({ embeds: [embed] })
                await interaction.reply({ embeds: [embed] })
            }
        } catch (error) {
            LogManager.error(error)
            await interaction.reply('Es ist ein Fehler aufgetreten!')
        }
    }
}
