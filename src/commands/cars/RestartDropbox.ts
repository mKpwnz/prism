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
		this.AllowedUsers = [Config.Discord.Users.List.EFORCE, Config.Discord.Users.List.SCHLAUCHI]
        this.IsBetaCommand = true
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('restartDropbox')
                .setDescription('Startet die Tebexausgabe neu'),
            this,
        )
        this.IsBetaCommand = true
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction
        const embed = this.getEmbedTemplate(interaction)
        try {
			let response = await RconClient.sendCommand('restart immo_store')
			LogManager.log(response)
            await interaction.reply({
                content: 'Neustart wurde ausgelöst!',
                ephemeral: true,
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
