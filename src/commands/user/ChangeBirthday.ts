import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'

export class ChangeBirthday extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('changeBirthday')
                .setDescription('Suche nach Spielern')
                //add string option
                .setDMPermission(true)
                .addStringOption((option) =>
                    option.setName('steam').setDescription('Steam ID des Nutzers').setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('datum')
                        .setDescription('Neuer Geburtstag des Spielers (dd.mm.yyyy)')
                        .setRequired(true),
                ) as SlashCommandBuilder,
            this,
        )
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction
        //if ((await IsUserAllowed(interaction, AllowedChannels, AllowedGroups)) === false) return
        const birthday = interaction.options.get('datum')?.value?.toString() ?? ''
        let steam = interaction.options.get('steam')?.value?.toString() ?? ''
        //Regex for date
        const regex = new RegExp(/^\d{1,2}\.\d{1,2}\.\d{4}$/)
        if (regex.test(birthday)) {
            let query = 'SELECT identifier FROM users WHERE identifier = '
            if (!steam.startsWith('steam:')) {
                query += `'steam:${steam}' LIMIT 1`
            } else {
                query += `'${steam}' LIMIT 1`
            }
            try {
                let result = await Database.query(query)
                let datarow = result[0] as RowDataPacket[]
                if (datarow.length > 0) {
                    query = 'UPDATE users SET dateofbirth = ' + `'${birthday}' WHERE identifier = '${steam}'`
                    result = await Database.execute(query)
                    if (result) {
                        await interaction.reply('Geburtstag erfolgreich geändert')
                    } else {
                        await interaction.reply('Es konnte kein Geburtstag geändert werden!')
                    }
                } else {
                    await interaction.reply('Es konnte kein Nutzer gefunden werden!')
                }
            } catch (error) {
                await interaction.reply({
                    content: 'Es ist ein Fehler aufgetreten!',
                    ephemeral: true,
                })
            }
        }
    }
}
