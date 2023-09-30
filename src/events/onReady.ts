import { DCEvent } from '@class/DCEvent'
import { CommandHandler } from '@commands/CommandHandler'
import { REST } from '@discordjs/rest'
import Config from '@proot/Config'
import LogManager from '@utils/Logger'
import { Routes } from 'discord-api-types/v9'
import { Client } from 'discord.js'

export class onReady extends DCEvent {
    async process(client: Client) {
        const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN as string)
        CommandHandler.initAll()
        const commandData = CommandHandler.commands.map((command) => command.scb.toJSON())
        await rest.put(Routes.applicationGuildCommands(client.user?.id ?? 'missing id', Config.Discord.ServerID), {
            body: commandData,
        })
        LogManager.log('Discord ready!')
    }
}
