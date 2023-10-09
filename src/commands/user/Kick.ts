import { Command } from '@class/Command'
import { RconClient } from '@class/RconClient'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import {
    ChatInputCommandInteraction,
    CommandInteraction,
    CommandInteractionOptionResolver,
    SlashCommandBuilder,
} from 'discord.js'

export class Kick extends Command {
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
                .setName('kick')
                .setDescription('Suche nach Spielern')
                .addIntegerOption((option) => option.setName('id').setDescription('ID des Spielers').setRequired(true))
                .addStringOption((option) => option.setName('grund').setDescription('Grund des Kicks')),
            this,
        )
    }
    // await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true })
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction
        let embed = this.getEmbedTemplate(interaction)

        try {
            const id = options.getInteger('id')
            const grund = options.getString('grund') ?? 'Du wurdest vom Support gekickt!'
            let response = await RconClient.sendCommand(`kick ${id} "${grund}"`)
            response = response.replace('print ', '')
            response = response.substring(4)
            response = response.replace('^7', '')
            response = response.replace('^1', '')
            response = response.trim()
            if (response.includes('Disconnected')) {
                embed.setTitle('Kick Player')
                embed.setDescription(
                    `SpielerID ${id} gekickt\nAntwort vom Server:\n\`${response.replace('print ', '').trim()}\``,
                )
                await interaction.reply({ embeds: [embed] })
            } else {
                await interaction.reply({
                    content: 'Spieler wurde nicht gefunden!',
                    ephemeral: true,
                })
            }
        } catch (error) {
            console.log(error)
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(error)}\`\`\``,
                ephemeral: true,
            })
        }
    }
}
