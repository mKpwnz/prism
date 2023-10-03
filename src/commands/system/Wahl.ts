import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import LogManager from '@utils/Logger'
import { Chart, ChartConfiguration } from 'chart.js'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels'
import {
    APIEmbed,
    CommandInteraction,
    CommandInteractionOptionResolver,
    SlashCommandBuilder,
    TextChannel,
} from 'discord.js'
import { RowDataPacket } from 'mysql2'

declare module 'chartjs-plugin-datalabels' {
    interface Context {
        [key: string]: any
    }
}

export class Wahl extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
        ]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('wahl')
                .setDescription('Wahlverwaltung!')
                .addSubcommand((subcommand) =>
                    subcommand.setName('erstellen').setDescription('Erstellt eine Wahl'),
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
                ) as SlashCommandBuilder,
            this,
        )
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return
        const status = ['Erstellt', 'Gestartet', 'Beendet', 'Löschen']
        let embed: APIEmbed = {
            color: 0x0099ff, // Farbe des Embeds
            author: {
                name: Config.Discord.BOT_NAME,
                icon_url: Config.Pictures.Prism.LOGO_BLUE,
            },
            footer: {
                text: interaction.user.displayName ?? '',
                icon_url: interaction.user.avatarURL() ?? '',
            },
            timestamp: new Date().toISOString(),
        }
        const options = interaction.options as CommandInteractionOptionResolver
        LogManager.log(options)
        if (options.getSubcommand() === 'erstellen') {
            await interaction.reply('Wahl erstellen')
        } else if (options.getSubcommand() === 'status') {
            try {
                if (options.getNumber('wahlid') === 0) {
                    await interaction.reply('Bitte gib eine WahlID an!')
                    return
                }
                let query = await Database.query<RowDataPacket[]>(
                    'SELECT id, name FROM immo_elections WHERE id = ?',
                    [options.getNumber('wahlid')],
                )
                if (query[0].length === 0) {
                    await interaction.reply('Es konnte keine Wahl mit dieser ID gefunden werden!')
                    return
                }
                await Database.query<RowDataPacket[]>(
                    'UPDATE immo_elections SET status = ?, updated = NOW() WHERE id = ?',
                    [options.getNumber('option_status'), options.getNumber('wahlid')],
                )
                const { id, name } = query[0][0] as {
                    id: string
                    name: string
                }
                embed.title = 'Wahlstatus geändert'
                embed.description =
                    'Wahlstatus für ' +
                    name +
                    ' (' +
                    id +
                    ')' +
                    ' auf ' +
                    status[options.getNumber('option_status') ?? 0] +
                    ' geändert!'
                const channel = (await interaction.guild?.channels.fetch(
                    Config.Discord.Channel.S1_WAHLEN,
                )) as TextChannel
                await channel?.send({ embeds: [embed] })
                await interaction.reply({ embeds: [embed] })
            } catch (error) {
                LogManager.error(error)
                await interaction.reply('Es ist ein Fehler aufgetreten!')
            }
        } else if (options.getSubcommand() === 'user') {
            if (
                options.getNumber('wahlid') === 0 ||
                options.getString('steamid') === '' ||
                options.getString('operation') === ''
            ) {
                await interaction.reply('Bitte gib eine WahlID an!')
                return
            }
            let query = await Database.query<RowDataPacket[]>(
                'SELECT id, name FROM immo_elections WHERE id = ?',
                [options.getNumber('wahlid')],
            )
            if (query[0].length === 0) {
                await interaction.reply('Es konnte keine Wahl mit dieser ID gefunden werden!')
                return
            }
            const { id, name } = query[0][0] as {
                id: string
                name: string
            }
            const fullname = await Database.query<RowDataPacket[]>(
                'SELECT firstname, lastname FROM users WHERE identifier = ?',
                [options.getString('steamid')],
            )
            if (fullname[0].length === 0) {
                await interaction.reply(
                    'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                )
                return
            }
            const { firstname, lastname } = fullname[0][0] as {
                firstname: string
                lastname: string
            }
            if (options.getString('operation') === 'add') {
                await Database.query<RowDataPacket[][]>(
                    'INSERT INTO immo_elections_participants (electionid, identifier, name) VALUES (?, ?, ?)',
                    [
                        options.getNumber('wahlid'),
                        options.getString('steamid'),
                        firstname + ' ' + lastname,
                    ],
                )
                embed.title = 'Nutzer hinzugefügt'
                embed.description =
                    'Nutzer ' +
                    firstname +
                    ' ' +
                    lastname +
                    ' zur Wahl ' +
                    name +
                    ' (' +
                    id +
                    ') hinzugefügt!'
                const channel = (await interaction.guild?.channels.fetch(
                    Config.Discord.Channel.S1_WAHLEN,
                )) as TextChannel
                await channel?.send({ embeds: [embed] })
                await interaction.reply({ embeds: [embed] })
            } else if (options.getString('operation') === 'remove') {
                try {
                    await Database.query<RowDataPacket[][]>(
                        'DELETE FROM immo_elections_participants WHERE electionid = ? AND identifier = ?',
                        [options.getNumber('wahlid'), options.getString('steamid')],
                    )
                    embed.title = 'Nutzer hinzugefügt'
                    embed.description =
                        'Nutzer ' +
                        firstname +
                        ' ' +
                        lastname +
                        ' von Wahl ' +
                        name +
                        ' (' +
                        id +
                        ') entfernt!'
                    const channel = (await interaction.guild?.channels.fetch(
                        Config.Discord.Channel.S1_WAHLEN,
                    )) as TextChannel
                    await channel?.send({ embeds: [embed] })
                    await interaction.reply({ embeds: [embed] })
                } catch (error) {
                    LogManager.error(error)
                    await interaction.reply('Es ist ein Fehler aufgetreten!')
                }
            }
        } else if (options.getSubcommand() === 'ergebnis') {
            try {
                let query = await Database.query<RowDataPacket[]>(
                    'SELECT id, name FROM immo_elections WHERE id = ?',
                    [options.getNumber('wahlid')],
                )
                if (query[0].length === 0) {
                    await interaction.reply('Es konnte keine Wahl mit dieser ID gefunden werden!')
                    return
                }
                const { id, name } = query[0][0] as {
                    id: string
                    name: string
                }
                interface IVote {
                    name: string
                    vote_count: number
                }
                let [rows] = await Database.query(
                    'SELECT ep.name as name, COUNT(ev.id) AS vote_count ' +
                        'FROM immo_elections_participants ep ' +
                        'LEFT JOIN immo_elections_votes ev ON ev.participantid = ep.id AND ev.electionid = ? ' +
                        'WHERE ep.electionid = ? GROUP BY ep.id ORDER BY vote_count DESC',
                    [options.getNumber('wahlid'), options.getNumber('wahlid')],
                )
                let votes = rows as IVote[]
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
                                    const percentage =
                                        (data[index] / data.reduce((acc, val) => acc + val, 0)) *
                                        100
                                    if (percentage < 5) return ''

                                    return `${percentage.toFixed(0)}%`
                                },
                            },
                        },
                    },
                } as ChartConfiguration
                const image = await chart.renderToBuffer(config)

                interaction.channel?.send({ files: [image] })

                embed.title = 'Wahlergebnis'
                embed.description = 'Wahlergebnis für ' + name + ' (' + id + ')'
                //post image to channel

                await interaction.reply({ embeds: [embed] })
            } catch (error) {
                LogManager.error(error)
                await interaction.reply('Es ist ein Fehler aufgetreten!')
            }
        }
    }
}
