import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { IUser } from '@sql/schema/User.schema'
import LogManager from '@utils/Logger'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'
import { WhoIs } from './WhoIs'

export class Rename extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_RENAME,
        ]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('rename')
                .setDescription('Suche nach Spielern')
                .addStringOption((option) =>
                    option
                        .setName('steam')
                        .setDescription('Steam ID des Nutzers')
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('vorname').setDescription('Vorname des Spielers'),
                )
                .addStringOption((option) =>
                    option.setName('nachname').setDescription('Nachname des Spielers'),
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
        let firstname = interaction.options.get('vorname')?.value?.toString() ?? vUser.firstname
        let lastname = interaction.options.get('nachname')?.value?.toString() ?? vUser.lastname
        if (firstname == '' && lastname == '') {
            await interaction.reply({
                content: 'Es wurde kein Vor- oder Nachname angegeben!',
                ephemeral: true,
            })
            return
        }
        try {
            let query = 'UPDATE users SET '
            LogManager.log(lastname)
            LogManager.log(vUser.lastname)
            if (firstname != vUser.firstname) {
                query += "firstname = '" + firstname + "'"
                if (lastname != vUser.lastname) {
                    query += ', '
                }
            }
            if (lastname != vUser.lastname) {
                query += "lastname = '" + lastname + "' "
            }

            LogManager.log(query)
            let result = (await Database.execute(query + 'WHERE identifier = ? ', [
                vUser.identifier,
            ])) as RowDataPacket[]
            if (result[0]['rowsChanged'] !== 0) {
                embed.setTitle('Spieler umbenannt')
                embed.setDescription(
                    'Der Spieler mit dem Namen "' +
                        vUser.firstname +
                        ' ' +
                        vUser.lastname +
                        '" (`' +
                        vUser.identifier +
                        '`) hat nun den Namen "' +
                        firstname +
                        ' ' +
                        lastname +
                        '".',
                )
                await interaction.reply({ embeds: [embed] })
            } else {
                await interaction.reply({
                    content: 'Der Spieler konnte nicht umbenannt werden!',
                    ephemeral: true,
                })
            }
        } catch (error) {
            LogManager.error(error)
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true })
        }
    }
}
