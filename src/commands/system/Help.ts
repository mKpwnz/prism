import { Command } from '@class/Command'
import { CommandHandler, RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import LogManager from '@utils/Logger'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

export class Ping extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_MOD,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        RegisterCommand(new SlashCommandBuilder().setName('help').setDescription('Liste aller Befehle!'), this)
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction
        var commands = CommandHandler.commands.map((cmd) => cmd.scb.name)
        LogManager.debug()
        interaction.reply('Test!')
    }
}
