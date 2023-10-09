import { Command } from '@class/Command'
import { RconClient } from '@class/RconClient'
import { RegisterCommand } from '@commands/CommandHandler'
import { EmbedBuilder } from '@discordjs/builders'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { IJobs } from '@sql/schema/Jobs.schema'
import { IUser } from '@sql/schema/User.schema'
import LogManager from '@utils/Logger'
import {
    CommandInteraction,
    CommandInteractionOptionResolver,
    SlashCommandBuilder,
} from 'discord.js'
import { RowDataPacket } from 'mysql2'
import { WhoIs } from './WhoIs'

export class Setjob extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
        ]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('setjob')
                .setDescription('Befehle um einen User in einen Job zu setzen')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('online')
                        .setDescription('Setze den Job eines Spieler, der online ist')
                        .addIntegerOption((option) =>
                            option
                                .setName('id')
                                .setDescription('ID des Spielers')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('jobname')
                                .setDescription('Name des Jobs')
                                .setRequired(true),
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('grade')
                                .setDescription('Grade des Spielers (Startet ab 0) (Default: 0)'),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('offline')
                        .setDescription('Setze den Job eines Spieler, der offline ist')
                        .addStringOption((option) =>
                            option
                                .setName('steamid')
                                .setDescription('SteamID des Spielers')
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName('jobname')
                                .setDescription('Name des Jobs')
                                .setRequired(true),
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('grade')
                                .setDescription('Grade des Spielers (Startet ab 0) (Default: 0)'),
                        ),
                ),
            this,
        )
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return
        if (this.CommandEmbed === null) this.CommandEmbed = this.updateEmbed(interaction)
        const options = interaction.options as CommandInteractionOptionResolver

        if (options.getSubcommand() === 'online') {
            await this.setOnline(this.CommandEmbed, interaction, options)
        } else if (options.getSubcommand() === 'offline') {
            await this.setOffline(this.CommandEmbed, interaction, options)
        } else {
            await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true })
        }
    }

    private async setOnline(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        let job = options.getString('jobname') ?? ''
        let grade = options.getInteger('grade') ?? 0
        if (job === '') {
            await interaction.reply({ content: 'Es wurde kein Job angegeben!', ephemeral: true })
            return
        }
        try {
            const [jobquery] = await Database.query<IJobs[]>('SELECT * FROM jobs WHERE name = ?', [
                job.toLowerCase(),
            ])
            if (jobquery.length === 0) {
                await interaction.reply({
                    content: 'Es wurde kein Job mit diesem Namen gefunden!',
                    ephemeral: true,
                })
                return
            }
            let response = await RconClient.sendCommand(
                `setjob ${options.getInteger('id')} ${job.toLowerCase()} ${grade}`,
            )
            embed.setTitle('Job geändert (online)')
            embed.setDescription(
                'Der Job von ID ' +
                    options.getInteger('id') +
                    ' wurde auf ' +
                    job +
                    ' Grade ' +
                    grade +
                    ' gesetzt!',
            )
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(
                    error,
                )}\`\`\``,
                ephemeral: true,
            })
        }
    }

    private async setOffline(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        const vUser = await WhoIs.validateUser(options.getString('steamid') ?? '')
        if (!vUser) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            })
            return
        }
        let job = options.getString('jobname') ?? ''
        let grade = options.getInteger('grade') ?? 0
        if (job === '') {
            await interaction.reply({ content: 'Es wurde kein Job angegeben!', ephemeral: true })
            return
        }
        try {
            const [jobquery] = await Database.query<IJobs[]>('SELECT * FROM jobs WHERE name = ?', [
                job.toLowerCase(),
            ])
            LogManager.debug(jobquery)
            if (jobquery.length === 0) {
                await interaction.reply({
                    content: 'Es wurde kein Job mit diesem Namen gefunden!',
                    ephemeral: true,
                })
                return
            }
            let query = (await Database.query(
                'UPDATE users SET job = ?, job_grade = ? WHERE identifier = ?',
                [job.toLowerCase(), grade, vUser.identifier],
            )) as RowDataPacket[]

            if (query[0]['affectedRows'] === 0) {
                await interaction.reply({
                    content: 'Der Job konnte nicht geändert werden!',
                    ephemeral: true,
                })
                return
            }
            embed.setTitle('Job geändert (offline)')
            embed.setDescription(
                'Der Job von ' +
                    vUser.firstname +
                    ' ' +
                    vUser.lastname +
                    ' (`' +
                    vUser.identifier +
                    '`)' +
                    ' wurde geändert!\nNeuer Job: ' +
                    jobquery[0].label +
                    '\nGrade: ' +
                    grade,
            )
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            LogManager.error(error)
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true })
        }
    }
}
