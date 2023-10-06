import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EmbedBuilder } from '@discordjs/builders'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import LogManager from '@utils/Logger'
import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'

export class Fraksperre extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER]
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
        let embed = new EmbedBuilder()
            .setColor(0x0792f1)
            .setTimestamp()
            .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
            .setFooter({
                text: interaction.user.displayName ?? '',
                iconURL: interaction.user.avatarURL() ?? '',
            })
        const options = interaction.options as CommandInteractionOptionResolver
        if (options.getSubcommand() === 'entfernen') {
            try {
                let steamid = options.getString('steamid') ?? ''
                if (!steamid.startsWith('steam:')) steamid = 'steam:' + steamid
                const fullname = await Database.query<RowDataPacket[]>(
                    'SELECT firstname, lastname, fraksperre FROM users WHERE identifier = ?',
                    [steamid],
                )
                if (fullname[0].length === 0) {
                    await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!')
                    return
                }
                const { firstname, lastname, fraksperre } = fullname[0][0] as {
                    firstname: string
                    lastname: string
                    fraksperre: Date
                }
                const today = new Date()
                if (fraksperre.getTime() < today.getTime()) {
                    await interaction.reply('Der Spieler hat keine Fraktionssperre!')
                    return
                } else {
                    await Database.query('UPDATE users SET fraksperre = NOW() WHERE identifier = ?', [steamid])
                    embed.setTitle('Fraktionssperre entfernt')
                    embed.setDescription(
                        `Die Fraktionssperre von ${firstname} ${lastname} (${steamid}) wurde entfernt!\nAltes Datum: ${fraksperre.toLocaleDateString()}`,
                    )
                    await interaction.reply({ embeds: [embed] })
                }
            } catch (error) {
                LogManager.error(error)
                await interaction.reply('Es ist ein Fehler aufgetreten!')
            }
        } else if (options.getSubcommand() === 'setzen') {
            try {
                let steamid = options.getString('steamid') ?? ''
                let days = options.getInteger('zeit') ?? 5
                if (!steamid.startsWith('steam:')) steamid = 'steam:' + steamid
                const fullname = await Database.query<RowDataPacket[]>(
                    'SELECT firstname, lastname, fraksperre FROM users WHERE identifier = ?',
                    [steamid],
                )
                if (fullname[0].length === 0) {
                    await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!')
                    return
                }
                const { firstname, lastname } = fullname[0][0] as {
                    firstname: string
                    lastname: string
                }
                let ts = new Date()
                ts.setDate(ts.getDate() + days)

                await Database.query(
                    'UPDATE users SET fraksperre = ADDDATE(NOW(), INTERVAL ? DAY) WHERE identifier = ?',
                    [days, steamid],
                )
                embed.setTitle('Fraktionssperre gesetzt')
                embed.setDescription(
                    'Die Fraktionssperre von ' +
                        firstname +
                        ' ' +
                        lastname +
                        ' (`' +
                        steamid +
                        '`)' +
                        ' wurde gesetzt!\nDauer: ' +
                        days +
                        ' Tage\nEndet am: ' +
                        ts.toLocaleDateString(),
                )
                await interaction.reply({ embeds: [embed] })
            } catch (error) {
                LogManager.error(error)
                await interaction.reply('Es ist ein Fehler aufgetreten!')
            }
        }
    }
}
