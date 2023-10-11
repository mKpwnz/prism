import 'dotenv/config' // THIS NEED TO BE AT THE TOP !!!IMPORTANT

import { EventHandler } from '@events/EventHandler'
import LogManager from '@utils/Logger'
import { Client, Collection, Events, IntentsBitField, Message, SnowflakeUtil, TextChannel } from 'discord.js'
import { ExpressApp } from '@web/ExpressApp'
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

client.once(Events.ClientReady, () => {
    new ExpressApp()
})

export const BotClient = client
