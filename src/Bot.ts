import 'dotenv/config'
import { EventHandler } from '@events/EventHandler'
import { Client, IntentsBitField } from 'discord.js'
import LogManager from '@utils/Logger'
LogManager.configure()

const token = process.env.DISCORD_TOKEN

LogManager.info('Bot is starting...')

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
