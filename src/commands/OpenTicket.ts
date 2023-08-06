import {
    ActionRowBuilder,
    CommandInteraction,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'
import { ICommand } from '../interfaces/ICommand'

export const openTicket: ICommand = {
    data: new SlashCommandBuilder().setName('openticket').setDescription('Open a ticket'),
    run: async (interaction: CommandInteraction) => {
        const modal: ModalBuilder = new ModalBuilder().setCustomId('ticket').setTitle('Ticket')

        const input1: TextInputBuilder = new TextInputBuilder()
            .setCustomId('input1')
            .setPlaceholder('Name')
            .setLabel('Ticket Name')
            .setStyle(TextInputStyle.Short)
            .setMinLength(3)
            .setMaxLength(20)

        const input2: TextInputBuilder = new TextInputBuilder()
            .setCustomId('input2')
            .setPlaceholder('Description')
            .setLabel('Ticket Description')
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(3)
            .setMaxLength(100)

        const firstRow: ActionRowBuilder<ModalActionRowComponentBuilder> = new ActionRowBuilder()
        firstRow.addComponents(input1)

        const secondRow: ActionRowBuilder<ModalActionRowComponentBuilder> = new ActionRowBuilder()
        secondRow.addComponents(input2)

        modal.addComponents(firstRow, secondRow)

        await interaction.showModal(modal)
    },
}
