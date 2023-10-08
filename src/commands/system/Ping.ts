import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

export class Ping extends Command {
    constructor() {
        super(true)
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_MOD,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        RegisterCommand(new SlashCommandBuilder().setName('ping').setDescription('Pong!'), this)
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction
        interaction.reply('Pong!')
    }
}
