/*import { Client } from 'discord.js'

export default (client: Client): void => {
    client.on('ready', async () => {
        if (!client.user || !client.application) {
            return
        }

        console.log(`${client.user.username} is online`)
    })
}*/

import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Client } from 'discord.js'
import { CommandList } from '../commands/_CommandList'

export const onReady = async (client: Client) => {
    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN as string)

    const commandData = CommandList.map((command) => command.data.toJSON())

    await rest.put(
        Routes.applicationGuildCommands(
            client.user?.id || 'missing id',
            process.env.GUILD_ID as string,
        ),
        { body: commandData },
    )

    console.log('Discord ready!')
}
