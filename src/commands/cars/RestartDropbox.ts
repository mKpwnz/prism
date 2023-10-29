import { Command } from '@class/Command'
import { RconClient } from '@class/RconClient'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import LogManager from '@utils/Logger'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export class RestartDropbox extends Command {
    constructor() {
        super()
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_TEBEX]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        this.AllowedUsers = [Config.Discord.Users.List.SCHLAUCHI]
        this.IsBetaCommand = true
        RegisterCommand(
            new SlashCommandBuilder().setName('restartdropbox').setDescription('Startet die Tebexausgabe neu'),
            this,
        )
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = this.getEmbedTemplate(interaction)
        try {
            let response = await RconClient.sendCommand('ensure immo_store')
            LogManager.log(response)
            embed.setTitle(`Dropbox neugestartet`)
            embed.setDescription(`Dropbox wurde neugestartet.`)
            await interaction.reply({
                embeds: [embed],
            })
        } catch (error) {
            console.log(error)
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(error)}\`\`\``,
                ephemeral: true,
            })
        }
    }
}
