import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

export class Ping extends Command {
    constructor() {
        super(true)
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_BOTTESTER]
        RegisterCommand(new SlashCommandBuilder().setName('ping').setDescription('Pong!'), this)
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction
        interaction.reply('Pong!')
    }
}
