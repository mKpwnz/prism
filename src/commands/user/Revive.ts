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

export class Revive extends Command {
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
                .setName('revive')
                .setDescription('Suche nach Spielern')
                //add string option
                .setDMPermission(true)
                .addIntegerOption((option) => option.setName('id').setDescription('ID des Spielers').setRequired(true))
                .addBooleanOption((option) =>
                    option.setName('kampfunfähig').setDescription('Kampfunfähigkeit hinzufügen?'),
                ),
            this,
        )
        this.IsBetaCommand = true
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction
        const embed = this.getEmbedTemplate(interaction)
        try {
            const id = options.getInteger('id')
            if (!id) {
                await interaction.reply({
                    content: 'ID wurde nicht gefunden!',
                    ephemeral: true,
                })
                return
            }
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
