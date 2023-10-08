import { Command } from '@class/Command'
import { RconClient } from '@class/RconClient'
import { RegisterCommand } from '@commands/CommandHandler'
import Config from '@proot/Config'
import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } from 'discord.js'

export class Revive extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [Config.Discord.Groups.DEV_BOTTESTER, Config.Discord.Groups.DEV_SERVERENGINEER]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('revive')
                .setDescription('Suche nach Spielern')
                //add string option
                .setDMPermission(true)
                .addIntegerOption((option) => option.setName('id').setDescription('ID des Spielers').setRequired(true))
                .addBooleanOption((option) =>
                    option.setName('kampfunfähig').setDescription('Kampfunfähigkeit hinzufügen?'),
                ) as SlashCommandBuilder,
            this,
        )
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        if (this.CommandEmbed === null) this.CommandEmbed = this.updateEmbed(interaction)
        let embed = this.CommandEmbed
        const options = interaction.options as CommandInteractionOptionResolver
        try {
            const id = options.getInteger('id')
            const kampf = options.getBoolean('kampfunfähig') ?? false
            let command = `revive ${id}`
            if (kampf) command = `revive ${id} 1`
            let response = await RconClient.sendCommand(command)
            await interaction.reply({
                content: 'Revivebefehl für ID ' + id + ' wurde ausgelöst!',
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
