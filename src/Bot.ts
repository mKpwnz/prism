import { Client, Events, IntentsBitField } from 'discord.js'
import { onInteraction } from './listeners/CommandHandler'
import { onReady } from './listeners/ready'

const dotenv = require('dotenv')
dotenv.config()

const token = process.env.DISCORD_TOKEN

// Test
console.log('Bot is starting...')

const client = new Client({
    intents: [
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
    ],
})

client.on('ready', async () => await onReady(client))
client.on('interactionCreate', async (interaction) => await onInteraction(interaction))
client.login(token)
