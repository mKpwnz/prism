import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { EENV } from '@prism/enums/EENV';
import { EEmbedColors } from '@prism/enums/EmbedColors';
import { VehicleService } from '@prism/services/VehicleService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { attachmentFromObject } from '@prism/utils/DiscordHelper';
import { RegisterCommand } from '@prism/decorators';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('deletevehicle')
        .setDescription('Löscht das Fahrzeug')
        .addStringOption((option) =>
            option.setName('plate').setDescription('Kennzeichen des Fahrzeugs').setRequired(true),
        ),
)
export class DeleteVehicle extends Command {
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
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const plate = interaction.options.getString('plate', true);

        const vehicle = await VehicleService.deleteVehicleByPlate(plate);
        if (vehicle instanceof Error) {
            await this.replyError(vehicle.message);
            return;
        }

        const attachment = attachmentFromObject(vehicle, `DeleteVehicleBackup_${plate}`);

        await this.replyWithEmbed({
            description: `Das Fahrzeugs mit dem Kennzeichen **${plate}** wurde erfolgreich gelöscht.`,
            color: EEmbedColors.SUCCESS,
            files: [attachment],
        });
    }
}

