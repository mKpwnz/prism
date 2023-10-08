import { Command } from '@class/Command'
import { RconClient } from '@class/RconClient'
import { RegisterCommand } from '@commands/CommandHandler'
import Config from '@proot/Config'
import {
    CommandInteraction,
    CommandInteractionOptionResolver,
    SlashCommandBuilder,
} from 'discord.js'

export class Kick extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.DEV_SERVERENGINEER,
        ]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('kick')
                .setDescription('Suche nach Spielern')
                //add string option
                .setDMPermission(true)
                .addIntegerOption((option) =>
                    option.setName('id').setDescription('ID des Spielers').setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('grund').setDescription('Grund des Kicks'),
                ) as SlashCommandBuilder,
            this,
        )
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        if (this.CommandEmbed === null) this.CommandEmbed = this.updateEmbed(interaction)
        let embed = this.CommandEmbed
        const options = interaction.options as CommandInteractionOptionResolver
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
                `SpielerID ${id} gekickt\nAntwort vom Server:\n\`${response
                    .replace('print ', '')
                    .trim()}\``,
            )
            await interaction.reply({ embeds: [embed] })
        } else {
            await interaction.reply({
                content: 'Spieler wurde nicht gefunden!',
                ephemeral: true,
            })
        }
    }
}
