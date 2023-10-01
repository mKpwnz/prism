import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import LogManager from '@utils/Logger'
import { CommandInteraction, CacheType, SlashCommandBuilder } from 'discord.js'

export class SchufaCheck extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.PRISM_DISCORDBOT]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_PRISM]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('schufacheck')
                .setDescription('Prüfe nach Hausbesitzern mit negativem Kontostand'),
            this,
        )
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        try {
            const response = await Database.query(
                `SELECT firstname, lastname, steamId, accounts FROM users u JOIN player_houses ph ON u.identifier = ph.identifier WHERE JSON_EXTRACT(u.accounts, '$.bank') < 0;`,
            )
            console.log(response)
            interaction.reply({
                content: `**${
                    response.length - 1
                }** Hausbesitzer mit negativem Kontostand gefunden.\`\`\`json\n${JSON.stringify(
                    response[0],
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
