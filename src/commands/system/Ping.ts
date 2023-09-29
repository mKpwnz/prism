import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import Config from '@proot/Config'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

export class Ping extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.PRISM_DISCORDBOT]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_PRISM]
        RegisterCommand(new SlashCommandBuilder().setName('ping').setDescription('Pong!'), this)
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction
        interaction.reply('Pong!')
    }
}
