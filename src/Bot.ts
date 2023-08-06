import {
    ChannelType,
    Client,
    ClientOptions,
    Events,
    Guild,
    IntentsBitField,
    TextChannel,
} from 'discord.js'
import { on } from 'events'
import { Ticket } from './classes/Ticket'
import { onInteraction } from './listeners/CommandHandler'
import { onReady } from './listeners/ready'

const dotenv = require('dotenv')
dotenv.config()

const token = process.env.DISCORD_TOKEN

console.log('Bot is starting...')

const client = new Client({
    intents: [
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
        //Add Interaction Create
    ],
})

client.on('ready', async () => await onReady(client))
client.on('interactionCreate', async (interaction) => await onInteraction(interaction))
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return
    if (interaction.customId === 'ticket') {
        let ticket: Ticket = new Ticket(
            'ticket-' + interaction.member?.user.username,
            'BeispielTicket',
            interaction.guild as Guild,
        )

        await interaction.reply({
            content: 'Ticket created!',
        })
    }
})
client.login(token)
