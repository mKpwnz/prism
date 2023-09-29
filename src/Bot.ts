import 'dotenv/config'
import { Client, Events, IntentsBitField } from 'discord.js'
import { Pool, createPool } from 'mysql2/promise'
import { onReady } from '@listeners/ready'
import { CommandHandler } from '@commands/CommandHandler'
import { onMessage } from '@listeners/MessageHandler'

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
client.on('interactionCreate', async (interaction) => await CommandHandler.onInteraction(interaction))
client.on('messageCreate', async (message) => await onMessage(message))

client.login(token)
