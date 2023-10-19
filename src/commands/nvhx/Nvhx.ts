import { Command } from '@class/Command'
import { RconClient } from '@class/RconClient'
import { RegisterCommand } from '@commands/CommandHandler'
import { NvhxData } from '@controller/NvhxData.controller'
import { Player } from '@controller/Player.controller'
import { EENV } from '@enums/EENV'
import { ILivePlayer } from '@interfaces/ILivePlayer'

import Config from '@proot/Config'
import { Helper } from '@utils/Helper'
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
                )
                .addSubcommand((subcommand) =>
                    subcommand.setName('checkplayerbans').setDescription('Triggert Neverhax Info'),
                ),
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
            case 'checkplayerbans':
                await this.nvhxCheckPlayerBans(interaction)
                break
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

    public async nvhxCheckPlayerBans(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction
        const embed = this.getEmbedTemplate(interaction)
        try {
            var bannedEmote = Helper.getEmote('pbot_banned')
            var bannedPlayers: ILivePlayer[] = []
            var livePlayers = await Player.getAllLivePlayers()
            for (const [key, value] of livePlayers.entries()) {
                var isBanned = await NvhxData.CheckIfUserIsBanned(value.identifiers)
                if (isBanned) {
                    bannedPlayers.push(value)
                }
            }
            var desc = `Es sind aktuell **${bannedPlayers.length}** von NVHX Global gebannte Spieler auf dem Server.\n`
            if (bannedPlayers.length > 0) desc += '\nAktuell gebannte Spieler:\n'
            bannedPlayers.forEach((player) => {
                desc += `\n${bannedEmote} **${player.name}** \`\`\`json ${player.identifiers}\`\`\``
            })
            embed.setDescription(desc)
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(error)}\`\`\``,
                ephemeral: true,
            })
        }
    }
}
