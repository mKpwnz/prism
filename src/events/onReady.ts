import { DCEvent } from '@class/DCEvent'
import { RconClient } from '@class/RconClient'
import { CommandHandler } from '@commands/CommandHandler'
import { REST } from '@discordjs/rest'
import Config from '@proot/Config'
import LogManager from '@utils/Logger'
import { Routes } from 'discord-api-types/v9'
import { Client } from 'discord.js'

export class onReady extends DCEvent {
    async process(client: Client) {
        var token =
            process.env.NODE_ENV === 'production' ? process.env.DISCORD_TOKEN_PROD : process.env.DISCORD_TOKEN_DEV

        const rest = new REST({ version: '9' }).setToken(token as string)
        CommandHandler.initAll()
        new RconClient()
        const commandData = CommandHandler.commands.map((command) => {
            return command.scb.toJSON()
        })
        await rest.put(Routes.applicationGuildCommands(client.user?.id ?? 'missing id', Config.Discord.ServerID), {
            body: commandData,
        })
        await this.updateEmotes(client)
        LogManager.info('Discord ready!')
    }

    async updateEmotes(client: Client): Promise<void> {
        LogManager.info('Cheking emotes...')
        const guild = client.guilds.cache.get(Config.Discord.ServerID)
        if (!guild) {
            LogManager.error('Guild not found!')
            return
        }
        for (const configEmote of Config.Discord.Emotes) {
            await guild.emojis.cache.forEach(async (e) => {
                if (e.name === configEmote.name) {
                    await guild.emojis.delete(e)
                    LogManager.info(`Deleted emote ${e.name} (${e.id})`)
                }
            })
        }
        for (const configEmote of Config.Discord.Emotes) {
            var newEmote = await guild.emojis.create({ name: configEmote.name, attachment: configEmote.link })
            LogManager.info(`Added/Updated emote ${newEmote.name} (${newEmote.id})`)
        }

        LogManager.info('Emotes checked!')
        return
    }
}
