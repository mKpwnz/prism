import { EventHandler } from '@events/EventHandler'
import LogManager from '@utils/Logger'
import { Client, IntentsBitField } from 'discord.js'
import 'dotenv/config'
LogManager.configure()

const token = process.env.NODE_ENV === 'production' ? process.env.DISCORD_TOKEN_PROD : process.env.DISCORD_TOKEN_DEV

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

export const BotClient = client
