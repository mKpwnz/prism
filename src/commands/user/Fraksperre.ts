import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EmbedBuilder } from '@discordjs/builders'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import LogManager from '@utils/Logger'
import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } from 'discord.js'
import { WhoIs } from './WhoIs'
import { EENV } from '@enums/EENV'

export class Fraksperre extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_BOTTESTER]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('fraksperre')
                .setDescription('Befehle zur Fraksperre')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('entfernen')
                        .setDescription('Entferne die Fraktionssperre eines Spielers')
                        .addStringOption((option) =>
                            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('setzen')
                        .setDescription('Setze dem Spieler eine Fraksperre')
                        .addStringOption((option) =>
                            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
                        )
                        .addIntegerOption((option) =>
                            option.setName('zeit').setDescription('Setze die Zeit in Tagen (Default: 5 Tage)'),
                        ),
                ),
            this,
        )
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return
        if (this.CommandEmbed === null) this.CommandEmbed = this.updateEmbed(interaction)
        const options = interaction.options as CommandInteractionOptionResolver

        if (options.getSubcommand() === 'entfernen') {
            await this.removeFraksperre(this.CommandEmbed, interaction, options)
        } else if (options.getSubcommand() === 'setzen') {
            await this.setFraksperre(this.CommandEmbed, interaction, options)
        }
    }

    private async removeFraksperre(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        const vUser = await WhoIs.validateUser(options.getString('steamid') ?? '')
        if (!vUser) {
            await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!')
            return
        }
        const today = new Date()
        if (vUser.fraksperre.getTime() < today.getTime()) {
            await interaction.reply('Der Spieler hat keine Fraktionssperre!')
            return
        } else {
            try {
                var dbResponse = await Database.query('UPDATE users SET fraksperre = NOW() WHERE identifier = ?', [
                    vUser.identifier,
                ])
                LogManager.debug(dbResponse)
            } catch (error) {
                LogManager.error(error)
                await interaction.reply('Es ist ein Fehler aufgetreten!')
            }
            LogManager.log(vUser)
            embed.setTitle('Fraktionssperre entfernt')
            embed.setDescription(
                `
                Die Fraktionssperre von ${vUser.firstname} ${vUser.lastname} (${vUser.identifier}) wurde entfernt!\n
                Altes Datum: ${vUser.fraksperre.toLocaleDateString()}`,
            )
            await interaction.reply({ embeds: [embed] })
        }
    }

    private async setFraksperre(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        let days = options.getInteger('zeit') ?? 5
        const vUser = await WhoIs.validateUser(options.getString('steamid') ?? '')
        if (!vUser) {
            await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!')
            return
        }
        let ts = new Date()
        ts.setDate(ts.getDate() + days)
        try {
            var dbResponse = await Database.query(
                'UPDATE users SET fraksperre = ADDDATE(NOW(), INTERVAL ? DAY) WHERE identifier = ?',
                [days, vUser.identifier],
            )
            LogManager.debug(dbResponse)
        } catch (error) {
            LogManager.error(error)
            await interaction.reply('Es ist ein Fehler aufgetreten!')
        }
        embed.setTitle('Fraktionssperre gesetzt')
        embed.setDescription(
            'Die Fraktionssperre von ' +
                vUser.firstname +
                ' ' +
                vUser.lastname +
                ' (`' +
                vUser.identifier +
                '`)' +
                ' wurde gesetzt!\nDauer: ' +
                days +
                ' Tage\nEndet am: ' +
                ts.toLocaleDateString(),
        )
        await interaction.reply({ embeds: [embed] })
    }
}
