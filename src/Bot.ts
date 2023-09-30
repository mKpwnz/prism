import 'dotenv/config'

import { EventHandler } from '@events/EventHandler'
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

EventHandler.init(client)

client.login(token)
