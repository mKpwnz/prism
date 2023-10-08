import { Command } from '@class/Command'
import { RconClient } from '@class/RconClient'
import { RegisterCommand } from '@commands/CommandHandler'

import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import LogManager from '../../utils/Logger'

export class Nvhx extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
        ]
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
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('info')
                        .setDescription('Triggert Neverhax Info')
                        .addIntegerOption((option) =>
                            option.setName('id').setDescription('SpielerID').setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('ban')
                        .setDescription('Bannt einen Nutzer')
                        .addIntegerOption((option) =>
                            option.setName('id').setDescription('SpielerID').setRequired(true),
                        ),
                ),
            this,
        )
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return
        if (this.CommandEmbed === null) this.CommandEmbed = this.updateEmbed(interaction)
        let embed = this.CommandEmbed
        const options = interaction.options as CommandInteractionOptionResolver

        switch (options.getSubcommand()) {
            case 'sc':
                await this.nvhxSc(embed, interaction, options)
                break
            case 'unban':
                await this.nvhxUnban(embed, interaction, options)
                break
            case 'info':
                await this.nvhxInfo(embed, interaction, options)
                break
            case 'ban':
                await this.nvhxBan(embed, interaction, options)
                break
            default:
                await interaction.reply({ content: 'Befehl nicht bekannt!', ephemeral: true })
        }
    }

    public async nvhxSc(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
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

    public async nvhxUnban(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
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

    public async nvhxInfo(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        try {
            const id = options.getInteger('id', true)
            RconClient.sendCommand(`nvhx info ${id}`)
            embed.setTitle('Neverhax Info')
            embed.setDescription(`Triggere Neverhax Info für SpielerID ${id}`)
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(error)}\`\`\``,
                ephemeral: true,
            })
        }
    }

    public async nvhxBan(
        embed: EmbedBuilder,
        interaction: CommandInteraction,
        options: CommandInteractionOptionResolver,
    ): Promise<void> {
        try {
            const id = options.getInteger('id', true)
            let response = await RconClient.sendCommand(`nvhx ban ${id}`)
            response = response.replace('print ', '')
            response = response.substring(4)
            response = response.replace('<-- NEVERHAX NVHX -->', '')
            response = response.replace('Violation: Banned by **CONSOLE**', '')
            response = response.trim()
            if (response.includes('Banned: ')) {
                embed.setTitle('Neverhax Ban')
                embed.setDescription(`Bannt SpielerID ${id}\nAntwort vom Server:\n\`\`\`${response}\`\`\``)
                await interaction.reply({ embeds: [embed] })
            } else {
                await interaction.reply({ content: 'Spieler nicht gefunden!', ephemeral: true })
            }
        } catch (error) {
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(error)}\`\`\``,
                ephemeral: true,
            })
        }
    }
}
