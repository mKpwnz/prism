import { Client, Events, IntentsBitField } from 'discord.js'
import { Pool, createPool } from 'mysql2/promise'
import { onInteraction } from './listeners/CommandHandler'
import { onMessage } from './listeners/MessageHandler'
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

const db = createPool({
    host: process.env.SQL_HOST,
    database: process.env.SQL_DATABASE,
    password: process.env.SQL_PASS,
    user: process.env.SQL_USER,
})

export default db

client.on('ready', async () => await onReady(client))
client.on('interactionCreate', async (interaction) => await onInteraction(interaction))
client.on('messageCreate', async (message) => await onMessage(message))

client.login(token)
