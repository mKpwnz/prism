import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { Player } from '@controller/Player.controller'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { GameDB } from '@sql/Database'
import LogManager from '@utils/Logger'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'

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
        const vPlayer = await Player.validatePlayer(steam)
        let embed = this.getEmbedTemplate(interaction)
        if (!vPlayer) {
            await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!')
            return
        }
        try {
            const newPosition = Config.Commands.Resetpos.DefaultPosition
            let query = 'UPDATE users SET position = ? WHERE identifier = ?'
            let result = (await GameDB.execute(query, [
                JSON.stringify(newPosition),
                vPlayer.identifiers.steam,
            ])) as RowDataPacket[]
            if (result[0]['rowsChanged'] !== 0) {
                embed.setTitle('Position zurückgesetzt')
                embed.setDescription(
                    `Die Position von ${vPlayer.playerdata.fullname} (${vPlayer.identifiers.steam}) wurde zurückgesetzt.`,
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
