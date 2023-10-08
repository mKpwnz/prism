import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'
import { WhoIs } from './WhoIs'
import { IUser } from '@sql/schema/User.schema'

export class ChangeName extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_RENAME]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('changeName')
                .setDescription('Suche nach Spielern')
                //add string option
                .setDMPermission(true)
                .addStringOption((option) =>
                    option.setName('steam').setDescription('Steam ID des Nutzers').setRequired(true),
                )
                .addStringOption((option) => option.setName('vorname').setDescription('Vorname des Spielers'))
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
        let firstname = interaction.options.get('vorname')?.value?.toString() ?? ''
        let lastname = interaction.options.get('nachname')?.value?.toString() ?? ''
        if (firstname == '' && lastname == '') {
            await interaction.reply({ content: 'Es wurde kein Vor- oder Nachname angegeben!', ephemeral: true })
            return
        }
        try {
            if (firstname != '') {
                firstname = "firstname = '" + firstname + "'"
                if (lastname != '') {
                    firstname = firstname + ', '
                }
            }
            if (lastname != '') {
                lastname = "lastname = '" + lastname + "'"
            }
            let query = 'UPDATE users SET ' + firstname + ' ' + lastname + ' WHERE identifier = ? RETURNING *'
            let [result] = await Database.execute<IUser[]>(query, [vUser.identifier])
            if (result[0]) {
                embed.setTitle('Spieler umbenannt')
                embed.setDescription(
                    'Der Spieler ' +
                        vUser.firstname +
                        ' ' +
                        vUser.lastname +
                        ' (' +
                        vUser.identifier +
                        ') hat nun den Namen ' +
                        result[0].firstname +
                        ' ' +
                        result[0].lastname,
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
