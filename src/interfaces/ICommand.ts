import { CommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js'

export interface ICommand {
    data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder
    run: (interaction: CommandInteraction) => Promise<void>
}
