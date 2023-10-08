import { Command } from '@class/Command'
import { CommandHandler, RegisterCommand } from '@commands/CommandHandler'
import { EmbedBuilder } from '@discordjs/builders'
import { EENV } from '@enums/EENV'
import { BotClient } from '@proot/Bot'
import Config from '@proot/Config'
import LogManager from '@utils/Logger'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

export class Help extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED]
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
    private getCommands(): ICmdPrintInformation[] {
        var CmdPrintInformation: ICmdPrintInformation[] = []
        CommandHandler.commands.map((cmd) => {
            var cmdOptions: ICmdPrintInformationOption[] = []
            var subCommands: ICmdPrintInformation[] = []
            cmd.scb.options?.map((opt) => {
                var json = JSON.parse(JSON.stringify(opt))
                if (json.type == 1) {
                    subCommands.push({
                        commandName: json.name,
                        description: json.description,
                        production: json.required ?? false,
                        commandOptions: json.options,
                    })
                } else {
                    cmdOptions.push({
                        name: json.name,
                        description: json.description,
                        required: json.required ?? false,
                        choices: json.choices,
                    })
                }
            })

            // if (cmd.cmd.RunEnvironment === EENV.PRODUCTION)
            CmdPrintInformation.push({
                commandName: cmd.scb.name,
                description: cmd.scb.description,
                production: cmd.cmd.RunEnvironment === EENV.PRODUCTION,
                commandOptions: cmdOptions ?? [],
                subCommands: subCommands,
                allowedChannels: cmd.cmd.AllowedChannels,
                allowedGroups: cmd.cmd.AllowedGroups,
            })
        })
        return CmdPrintInformation
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction

        var cmds = this.getCommands()
        var fields: { name: string; value: string }[] = []
        var embeds: EmbedBuilder[] = []
        cmds.forEach((cmd) => {
            if (!cmd.production) return
            var groupString = ''
            if (cmd.allowedGroups) {
                cmd.allowedGroups.forEach((group) => {
                    if (group == Config.Discord.Groups.DEV_BOTTESTER) return
                    if (
                        group == Config.Discord.Groups.DEV_SERVERENGINEER &&
                        channel?.id != Config.Discord.Channel.WHOIS_TESTI
                    )
                        return
                    groupString += `[**${BotClient.guilds.cache
                        .get(Config.Discord.ServerID)
                        ?.roles.cache.get(group)
                        ?.name.replace('ic | ', '')}**] `
                })
            }

            if (cmd.subCommands && cmd.subCommands.length > 0) {
                cmd.subCommands.forEach((subcmd) => {
                    fields.push({
                        name: `**/${cmd.commandName} ${subcmd.commandName} ${subcmd.commandOptions
                            .map((opt) => (opt.required ? `[${opt.name}]` : `<${opt.name}>`))
                            .join(' ')}**`,
                        value: `*${subcmd.description}*\n${
                            cmd.allowedChannels
                                ? `${cmd.allowedChannels.map((channel) => `<#${channel}>`).join(' ')}`
                                : ''
                        }\n${groupString}\n`,
                    })
                })
            } else {
                fields.push({
                    name: `**/${cmd.commandName} ${cmd.commandOptions
                        .map((opt) => (opt.required ? `<${opt.name}>` : `[${opt.name}]`))
                        .join(' ')}**`,
                    value: `*${cmd.description}*\n${
                        cmd.allowedChannels ? `${cmd.allowedChannels.map((channel) => `<#${channel}>`).join(' ')}` : ''
                    }\n${groupString}\n`,
                })
            }
        })
        const MAX_LENGHT = 15
        var embedCount = Math.ceil(fields.length / MAX_LENGHT)

        for (let i = 0; i < embedCount; i++) {
            let localEmbed = new EmbedBuilder()
                .setColor(0x0792f1)
                .setTimestamp()
                .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
                .setFooter({
                    text: interaction.user.displayName ?? '',
                    iconURL: interaction.user.avatarURL() ?? '',
                })
                .setTimestamp(new Date())
            localEmbed.setTitle(`**Befehlsübersicht** ${embedCount > 1 ? `${i + 1} / ${embedCount}` : ''}`)

            var des = ''
            for (let j = 0; j < MAX_LENGHT; j++) {
                if (fields[i * MAX_LENGHT + j]) {
                    des += `${fields[i * MAX_LENGHT + j].name}\n${fields[i * MAX_LENGHT + j].value}\n`
                } else {
                    break
                }
            }
            localEmbed.setDescription(des)
            localEmbed.setImage(Config.Pictures.WHITESPACE)
            embeds.push(localEmbed)
        }

        await interaction.reply({ content: ' ', embeds: embeds })
        // await interaction.user.send({ content: ' ', embeds: embeds })
    }
}
interface ICmdPrintInformation {
    commandName: string
    description: string
    production: boolean
    commandOptions: ICmdPrintInformationOption[]
    subCommands?: ICmdPrintInformation[]
    allowedChannels?: string[]
    allowedGroups?: string[]
}
interface ICmdPrintInformationOption {
    name: string
    description: string
    required: boolean
    choices?: {
        name: string
        value: string
    }[]
}
