import { CommandInteraction, Interaction, ModalBuilder, SlashCommandBuilder } from 'discord.js'
import { ICommand } from '../interfaces/ICommand'

export const openTicket: ICommand = {
    data: new SlashCommandBuilder().setName('openticket').setDescription('Open a ticket'),
    run: async (interaction: CommandInteraction) => {
        await interaction.reply('Ticket opened!')
        //await interaction.showModal(modal)
    },
}
