import Config from '@Config';
import Command from '@class/Command';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { VehicleService } from '@services/VehicleService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { attachmentFromObject } from '@utils/DiscordHelper';
import { RegisterCommand } from '@decorators';

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
            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
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

