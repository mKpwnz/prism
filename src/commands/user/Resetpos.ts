import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { GameDB } from '@sql/Database'
import { IUser } from '@sql/schema/User.schema'
import LogManager from '@utils/Logger'
import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'
import { WhoIs } from './WhoIs'

export class Resetpos extends Command {
    constructor() {
        super()
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
        ]
        this.IsBetaCommand = true
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('resetpos')
                .setDescription('Setze die Position eines Spielers zum Würfelpark zurück')
                //add string option
                .setDMPermission(true)
                .addStringOption((option) =>
                    option.setName('steam').setDescription('Steam ID des Nutzers').setRequired(true),
                ),
            this,
        )
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        let steam = interaction.options.get('steam')?.value?.toString() ?? ''
        const vUser = await WhoIs.validateUser(steam ?? '')
        let embed = this.getEmbedTemplate(interaction)
        if (!vUser) {
            await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!')
            return
        }
        try {
            const newPosition = Config.Commands.Resetpos.DefaultPosition
            let query = 'UPDATE users SET position = ? WHERE identifier = ?'
            let result = (await GameDB.execute(query, [
                JSON.stringify(newPosition),
                vUser.identifier,
            ])) as RowDataPacket[]
            if (result[0]['rowsChanged'] !== 0) {
                embed.setTitle('Position zurückgesetzt')
                embed.setDescription(
                    'Die Position von ' +
                        vUser.firstname +
                        ' ' +
                        vUser.lastname +
                        ' (`' +
                        vUser.identifier +
                        '`) wurde zurückgesetzt.',
                )
                await interaction.reply({ embeds: [embed] })
            } else {
                await interaction.reply({
                    content: 'Der Versuch, die Position zu ändern, ist fehlgeschlagen!',
                    ephemeral: true,
                })
            }
        } catch (error) {
            LogManager.error(error)
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true })
        }
    }
}
