import { Client, Events, IntentsBitField } from 'discord.js'
import { onInteraction } from './listeners/CommandHandler'
import { onOpenTicket } from './listeners/TicketHandler'
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
client.on(Events.InteractionCreate, async (interaction) => await onOpenTicket(interaction))
client.login(token)
