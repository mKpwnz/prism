import 'dotenv/config' // THIS NEED TO BE AT THE TOP !!!IMPORTANT

import { EventHandler } from '@events/EventHandler'
import { Cache } from '@utils/Cache'
import LogManager from '@utils/Logger'
import { ExpressApp } from '@web/ExpressApp'
import { Client, Events, IntentsBitField } from 'discord.js'
import { CronManager } from '@utils/CronManager'
import { CronJob } from 'cron'
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

Cache.init()
EventHandler.init(client)
client.login(token)
client.once(Events.ClientReady, () => {
    new ExpressApp()
    // CronManager.initCronManager({
    //     'fraktionen.finance': new CronJob('*/10 * * * * *', () => {
    //         LogManager.debug('Cronjob started: fraktionen.finance')
    //     }),
    // })
})

export const BotClient = client
