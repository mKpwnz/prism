import { Client, ClientOptions, IntentsBitField } from 'discord.js'
import { on } from 'events'
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
    ],
})

client.on('ready', async () => await onReady(client))
client.on('interactionCreate', async (interaction) => await onInteraction(interaction))
client.login(token)
