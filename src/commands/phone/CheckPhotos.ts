import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { PhonePhotosService } from '@prism/services/PhonePhotosService';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

// TODO add typedoc for this command
// TODO refactor
@RegisterCommand(
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
                .addChoices({ name: '2023', value: '2023' }, { name: '2024', value: '2024' }),
        )
        .addBooleanOption((option) =>
            option.setName('selectall').setDescription('Alle auswählen?'),
        ),
)
export class CheckPhotos extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.BOT_DEV,
        ];
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const date: Date = new Date();
        const year: number = interaction.options.getNumber('year') ?? date.getFullYear();
        const month: number = interaction.options.getNumber('month') ?? date.getMonth() + 1;
        const selectAll: boolean = interaction.options.getBoolean('selectall') ?? false;
        const deleteOption: boolean = interaction.options.getBoolean('delete') ?? false;

        let user: string[] = [];
        if (!selectAll) {
            user = await PhonePhotosService.checkAllPhotosWithProgress(
                new Date(`${year}-${month}-1`),
                new Date(`${year}-${month}-31`),
                interaction,
                deleteOption,
            );
        } else {
            user = await PhonePhotosService.checkAllPhotosWithProgress(
                new Date('2023-1-1'),
                new Date(),
                interaction,
                deleteOption,
            );
        }

        // Remove duplicate string entries
        const userset = [...new Set(user)];
        // userset in embed
        const embeds: EmbedBuilder[] = [];
        // Split userset into chunks of 25
        for (let i = 0; i < userset.length; i += 150) {
            embeds.push(
                this.getEmbedTemplate({
                    title: 'Nutzer mit illegalen Fotos',
                    description: `${userset.slice(i, i + 150).join('\n')}`,
                }),
            );
        }

        if (embeds.length === 0) {
            await interaction.editReply(
                '▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰ 100% / 100% | Check completed, no illegal photos found!',
            );
        } else {
            await interaction.editReply({ embeds });
        }
    }
}
