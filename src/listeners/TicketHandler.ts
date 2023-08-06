import { Guild, Interaction } from 'discord.js'
import { Ticket } from '../classes/Ticket'

export const onOpenTicket = async (interaction: Interaction) => {
    if (!interaction.isModalSubmit()) return
    if (interaction.customId === 'ticket') {
        let ticket: Ticket = new Ticket(
            'ticket-' + interaction.member?.user.username,
            'BeispielTicket',
            interaction.guild as Guild,
            interaction.member?.user.id as string,
        )

        ticket.channel?.permissionOverwrites
            .create(process.env.ADMIN_ROLE_ID as string, {
                SendMessages: false,
            })
            .then(console.log)
            .catch(console.error)

        await interaction.reply({
            content: 'Ticket created!',
        })
    }
}
