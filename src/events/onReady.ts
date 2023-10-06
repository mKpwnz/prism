import { DCEvent } from '@class/DCEvent'
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
        const commandData = CommandHandler.commands.map((command) => {
            LogManager.debug(command.scb.name)
            LogManager.debug(command.scb.description)
            return command.scb.toJSON()
        })
        await rest.put(Routes.applicationGuildCommands(client.user?.id ?? 'missing id', Config.Discord.ServerID), {
            body: commandData,
        })
        LogManager.info('Discord ready!')
    }
}
