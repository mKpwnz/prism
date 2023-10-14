import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { BotDB } from '@sql/Database'
import LogManager from '@utils/Logger'
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export class BotStats extends Command {
    constructor() {
        super()
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
        ]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('botstats')
                .setDescription('Zeigt die aktuellen Nutzungsstatistiken des bots.'),
            this,
        )
        this.DoNotCountUse = true
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = this.getEmbedTemplate(interaction)
        embed.setTitle('Bot Stats')
        const data = await BotDB.command_log.groupBy({
            by: ['command'],
            _count: {
                command: true,
            },
            orderBy: {
                _count: {
                    command: 'desc',
                },
            },
        })
        var table = new AsciiTable3('Command Stats')
            .setStyle('unicode-single')
            .setHeading('Command', 'Count')
            .setAlign(1, AlignmentEnum.LEFT)
            .setAlign(2, AlignmentEnum.RIGHT)
        data.forEach((d) => {
            table.addRow(d.command, d._count.command)
        })
        embed.setDescription(`\`\`\`\n${table.toString()}\`\`\``)
        LogManager.debug(data)
        await interaction.reply({ content: '', embeds: [embed] })
    }
}
