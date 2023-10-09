import { Command } from '@class/Command'
import { CommandHandler, RegisterCommand } from '@commands/CommandHandler'
import { EmbedBuilder } from '@discordjs/builders'
import { EENV } from '@enums/EENV'
import { BotClient } from '@proot/Bot'
import Config from '@proot/Config'
import { Helper } from '@utils/Helper'
import LogManager from '@utils/Logger'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

interface ICmdPrintInformation {
    commandName: string
    description: string
    production: boolean
    isBeta: boolean
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

export class Help extends Command {
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
                        isBeta: cmd.cmd.IsBetaCommand,
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
                isBeta: cmd.cmd.IsBetaCommand,
            })
        })
        return CmdPrintInformation
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction
        if (!channel) return
        var betaEmote = await Helper.getEmote('pbot_beta')
        LogManager.debug(betaEmote)
        var cmds = this.getCommands()
        var fields: { name: string; value: string }[] = []
        var embeds: EmbedBuilder[] = []
        cmds.forEach((cmd) => {
            // if (!cmd.production) return
            var groupString = ''
            if (cmd.allowedGroups) {
                cmd.allowedGroups.forEach((group) => {
                    if (group == Config.Discord.Groups.DEV_BOTTESTER) return
                    if (
                        group == Config.Discord.Groups.DEV_SERVERENGINEER &&
                        channel.id != Config.Discord.Channel.WHOIS_TESTI
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
                        name: `${cmd.isBeta && betaEmote ? `${betaEmote} ` : ''}**/${cmd.commandName} ${
                            subcmd.commandName
                        } ${subcmd.commandOptions
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
                    name: `${cmd.isBeta && betaEmote ? `${betaEmote} ` : ''}**/${cmd.commandName} ${cmd.commandOptions
                        .map((opt) => (opt.required ? `<${opt.name}>` : `[${opt.name}]`))
                        .join(' ')}**`,
                    value: `*${cmd.description}*\n${
                        cmd.allowedChannels ? `${cmd.allowedChannels.map((channel) => `<#${channel}>`).join(' ')}` : ''
                    }\n${groupString}\n`,
                })
            }
        })
        fields.push({
            name: '### Hinweis',
            value: `Die Befehle mit dem ${betaEmote} sind aktuell in der BETA phase!`,
        })
        const MAX_LENGHT = 15
        var embedCount = Math.ceil(fields.length / MAX_LENGHT)

        for (let i = 0; i < embedCount; i++) {
            let localEmbed = this.getEmbedTemplate(interaction)
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
        await interaction.reply({ content: 'Die übersicht aller Commands:', ephemeral: true })
        embeds.forEach(async (embed) => {
            await channel.send({ embeds: [embed] })
        })
    }
}
