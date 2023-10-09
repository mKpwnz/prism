import { Command } from '@class/Command'
import { RconClient } from '@class/RconClient'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'

import Config from '@proot/Config'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export class Nvhx extends Command {
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
        this.IsBetaCommand = true
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('nvhx')
                .setDescription('Neverhax Commands')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('sc')
                        .setDescription('Triggert Neverhax Screenshot')
                        .addIntegerOption((option) =>
                            option.setName('id').setDescription('SpielerID').setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('unban')
                        .setDescription('Entbanne einen Nutzer')
                        .addStringOption((option) =>
                            option.setName('banid').setDescription('BanID des Banns').setRequired(true),
                        ),
                ),
            // .addSubcommand((subcommand) =>
            //     subcommand
            //         .setName('info')
            //         .setDescription('Triggert Neverhax Info')
            //         .addIntegerOption((option) =>
            //             option.setName('id').setDescription('SpielerID').setRequired(true),
            //         ),
            // ),
            this,
        )
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction

        switch (options.getSubcommand()) {
            case 'sc':
                await this.nvhxSc(interaction)
                break
            case 'unban':
                await this.nvhxUnban(interaction)
                break
            // case 'info':
            //     await this.nvhxInfo(interaction)
            //     break
            default:
                await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true })
        }
    }

    public async nvhxSc(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction
        const embed = this.getEmbedTemplate(interaction)
        try {
            const id = options.getInteger('id', true)
            let response = await RconClient.sendCommand(`nvhx sc ${id}`)
            embed.setTitle('Neverhax Screenshot')
            embed.setDescription(`Triggere Neverhax Screenshot für SpielerID ${id}`)
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(error)}\`\`\``,
                ephemeral: true,
            })
        }
    }

    public async nvhxUnban(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction
        const embed = this.getEmbedTemplate(interaction)
        try {
            const banid = options.getString('banid', true)
            let response = await RconClient.sendCommand(`nvhx unban ${banid}`)
            if (response.includes('Unbanned: ')) {
                embed.setTitle('Neverhax Unban')
                embed.setDescription(`Entbanne BanID ${banid}`)
                await interaction.reply({ embeds: [embed] })
            } else {
                await interaction.reply({ content: 'BanID nicht gefunden!', ephemeral: true })
            }
        } catch (error) {
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(error)}\`\`\``,
                ephemeral: true,
            })
        }
    }

    // public async nvhxInfo(interaction: ChatInputCommandInteraction): Promise<void> {
    //     const { options } = interaction
    //     const embed = this.getEmbedTemplate(interaction)
    //     try {
    //         const id = options.getInteger('id', true)
    //         RconClient.sendCommand(`nvhx info ${id}`)
    //         embed.setTitle('Neverhax Info')
    //         embed.setDescription(`Triggere Neverhax Info für SpielerID ${id}`)
    //         await interaction.reply({ embeds: [embed] })
    //     } catch (error) {
    //         await interaction.reply({
    //             content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(error)}\`\`\``,
    //             ephemeral: true,
    //         })
    //     }
    // }
}
