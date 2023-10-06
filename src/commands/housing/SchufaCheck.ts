import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import LogManager from '@utils/Logger'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'

interface schufaUser extends RowDataPacket {
    firstname: string
    lastname: string
    steamId: string
    accounts: any
}

export class SchufaCheck extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_BOTTESTER]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('schufacheck')
                .setDescription('Prüfe nach Hausbesitzern mit negativem Kontostand'),
            this,
        )
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        try {
            const [schufaUsers] = await Database.query<schufaUser[]>(
                `SELECT firstname, lastname, steamId, accounts FROM users u JOIN player_houses ph ON u.identifier = ph.identifier WHERE JSON_EXTRACT(u.accounts, '$.bank') < 0;`,
            )
            for (const user of schufaUsers) {
                schufaUsers[schufaUsers.indexOf(user)].accounts = JSON.parse(user.accounts)
            }
            interaction.reply({
                content: `**${
                    schufaUsers.length
                }** Hausbesitzer mit negativem Kontostand gefunden.\`\`\`json\n${JSON.stringify(
                    schufaUsers,
                    null,
                    4,
                )}\`\`\``,
            })
        } catch (e) {
            LogManager.error(e)
            interaction.reply({
                content: `Fehler beim ausführen des Befeheles.`,
                ephemeral: true,
            })
        }
    }
}
