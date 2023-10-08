import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'
import { WhoIs } from './WhoIs'
import { IUser } from '@sql/schema/User.schema'

export class Resetpos extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_MOD,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('resetpos')
                .setDescription('Setze die Position eines Spielers zum Würfelpark zurück')
                //add string option
                .setDMPermission(true)
                .addStringOption((option) =>
                    option.setName('steam').setDescription('Steam ID des Nutzers').setRequired(true),
                ) as SlashCommandBuilder,
            this,
        )
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        let steam = interaction.options.get('steam')?.value?.toString() ?? ''
        const vUser = await WhoIs.validateUser(steam ?? '')
        if (this.CommandEmbed === null) this.CommandEmbed = this.updateEmbed(interaction)
        let embed = this.CommandEmbed
        if (!vUser) {
            await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!')
            return
        }
        try {
            const newPosition = { x: 229.28, heading: 0.0, z: 30.5, y: -886.76 }
            let query =
                'UPDATE users SET position = "' + JSON.stringify(newPosition) + '"WHERE identifier = ? RETURNING *'
            let [result] = await Database.execute<IUser[]>(query, [vUser.identifier])
            if (result[0]) {
                embed.setTitle('Position zurückgesetzt')
                embed.setDescription(
                    'Die Position von ' +
                        vUser.firstname +
                        ' ' +
                        vUser.lastname +
                        ' (' +
                        vUser.identifier +
                        ') wurde zurückgesetzt.',
                )
                await interaction.reply({ embeds: [embed] })
            } else {
                await interaction.reply({
                    content: 'Der Versuch, die Position zu ändern, ist fehlgeschlagen!',
                    ephemeral: true,
                })
            }
        } catch (error) {
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true })
        }
    }
}
