import 'dotenv/config'

import { CommandHandler } from '@commands/CommandHandler'
import { onMessage } from '@listeners/MessageHandler'
import { onReady } from '@listeners/ready'
import { Client, IntentsBitField } from 'discord.js'

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
client.on('interactionCreate', async (interaction) => await CommandHandler.onInteraction(interaction))
client.on('messageCreate', async (message) => await onMessage(message))

client.login(token)
