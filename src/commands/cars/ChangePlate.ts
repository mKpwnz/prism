import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { EEmbedColors } from '@prism/enums/EmbedColors';
import { VehicleService } from '@prism/services/VehicleService';
import { formatPlate } from '@prism/utils/FiveMHelper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('changeplate')
        .setDescription('Ändert das Kennzeichen des Fahrzeugs')
        .addStringOption((option) =>
            option
                .setName('oldplate')
                .setDescription('Aktuelles Kennzeichen des Fahrzeugs')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('newplate')
                .setDescription('Neues Kennzeichen des Fahrzeugs')
                .setRequired(true),
        ),
)
export class ChangePlate extends Command {
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
            Config.Groups.PROD.BOT_DEV,
        ];
        this.AllowedUsers = [
            Config.Users.SCHLAUCHI,
            Config.Users.LUCASJHW,
            Config.Users.JUNGLEJANIS,
        ];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const oldplate = interaction.options.getString('oldplate', true);
        const newplate = interaction.options.getString('newplate', true);

        const result = await VehicleService.changeVehiclePlate(oldplate, newplate);
        if (result instanceof Error) {
            await this.replyError(result.message);
            return;
        }
        await this.replyWithEmbed({
            description: `Das Fahrzeug mit dem Kennzeichen **${oldplate}** hat nun das Kennzeichen **${formatPlate(
                newplate,
            )}**.`,
            color: EEmbedColors.SUCCESS,
        });
    }
}

