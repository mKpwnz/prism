import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { ICommand } from '../interfaces/ICommand'
import Config from '../Config'
import { IsUserAllowed } from '../Helper'

const AllowedChannels = [Config.Discord.Channel.PRISM_TEST]
const AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER]

export const Ping: ICommand = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Test Nachricht für den Bot'),
    run: async (interaction: CommandInteraction) => {
        const { channel, user, guild } = interaction
        if ((await IsUserAllowed(interaction, AllowedChannels, AllowedGroups)) === false) return
        interaction.reply('Pong!')
    },
}
