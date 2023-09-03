import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Client } from 'discord.js'
import { CommandList } from '../commands/_CommandList'
import Config from '../Config'

export const onReady = async (client: Client) => {
    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN as string)

    const commandData = CommandList.map((command) => command.data.toJSON())

    await rest.put(Routes.applicationGuildCommands(client.user?.id ?? 'missing id', Config.Discord.ServerID), {
        body: commandData,
    })

    console.log('Discord ready!')
}
