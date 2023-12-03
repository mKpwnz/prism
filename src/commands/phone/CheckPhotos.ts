import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { PhonePhotosController } from '@controller/PhonePhotos.controller'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import LogManager from '../../utils/Logger'

export class CheckPhotos extends Command {
    constructor() {
        super()
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
        this.IsBetaCommand = true
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('checkphotos')
                .setDescription('Check Photos!')
                .addBooleanOption((option) =>
                    option.setName('delete').setDescription('Bilder auch löschen?'),
                )
                .addNumberOption((option) =>
                    option
                        .addChoices(
                            { name: 'Januar', value: 1 },
                            { name: 'Februar', value: 2 },
                            { name: 'März', value: 3 },
                            { name: 'April', value: 4 },
                            { name: 'Mai', value: 5 },
                            { name: 'Juni', value: 6 },
                            { name: 'Juli', value: 7 },
                            { name: 'August', value: 8 },
                            { name: 'September', value: 9 },
                            { name: 'Oktober', value: 10 },
                            { name: 'November', value: 11 },
                            { name: 'Dezember', value: 12 },
                        )
                        .setName('month')
                        .setDescription('Monat'),
                )
                .addStringOption((option) =>
                    option
                        .setName('year')
                        .setDescription('Jahr')
                        .addChoices(
                            { name: '2023', value: '2023' },
                            { name: '2024', value: '2024' },
                        ),
                )
                .addBooleanOption((option) =>
                    option.setName('selectall').setDescription('Alle auswählen?'),
                ),

            this,
        )
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply()
        // Check if delete option is set
        let date = new Date()
        let year = interaction.options.getNumber('year') ?? date.getFullYear()
        let month = interaction.options.getNumber('month') ?? date.getMonth() + 1
        let selectAll = interaction.options.getBoolean('selectall') ?? false
        let deleteOption = interaction.options.getBoolean('delete') ?? false
        let user: string[] = []
        if (!selectAll) {
            user = await PhonePhotosController.checkAllPhotosWithProgress(
                new Date(year + '-' + month + '-1'),
                new Date(year + '-' + month + '-31'),
                interaction,
                deleteOption,
            )
        } else {
            user = await PhonePhotosController.checkAllPhotosWithProgress(
                new Date('2023-1-1'),
                new Date('2024-12-31'),
                interaction,
                deleteOption,
            )
        }

        // Remove duplicate string entries
        let userset = [...new Set(user)]
        // userset in embed
        let embeds: EmbedBuilder[] = []
        // Split userset into chunks of 25
        for (let i = 0; i < userset.length; i += 150) {
            const current = userset.slice(i, i + 150)
            let embed = this.getEmbedTemplate(interaction)
            embed.setTitle('Nutzer mit illegalen Fotos')
            embed.setDescription(`${current.join('\n')}`)
            embeds.push(embed)
        }

        if (embeds.length == 0) {
            interaction.editReply(
                '▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰ 100% / 100% | Check completed, no illegal photos found!',
            )
        } else {
            interaction.editReply({ embeds: embeds })
        }
    }
}
