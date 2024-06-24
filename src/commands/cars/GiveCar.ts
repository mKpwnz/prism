import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { EEmbedColors } from '@prism/typings/enums/EmbedColors';
import { PlayerService } from '@prism/services/PlayerService';
import { VehicleService } from '@prism/services/VehicleService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('givecar')
        .setDescription('Schenke einem Spieler ein Fahrzeug')
        .addStringOption((option) =>
            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
        )
        .addStringOption((option) =>
            option.setName('vehicle').setDescription('Der Name des Fahrzeugs').setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('plate')
                .setDescription('Das (optionale) Kennzeichen des Fahrzeugs')
                .setRequired(false),
        ),
)
export class GiveCar extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [Config.Groups.PROD.BOT_DEV];
        this.AllowedUsers = [Config.Users.SCHLAUCHI];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamId = interaction.options.getString('steamid', true);
        const vehicleName = interaction.options.getString('vehicle', true);
        const plate = interaction.options.getString('plate', false);

        const vPlayer = await PlayerService.validatePlayer(steamId);
        if (!vPlayer) {
            await interaction.reply({
                content: `Es konnte kein Spieler mit der SteamID \`${steamId}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }

        const result = await VehicleService.createVehicle(vPlayer, vehicleName, plate);
        if (result instanceof Error) {
            await this.replyError(result.message);
        }

        await this.replyWithEmbed({
            description: result as string,
            color: EEmbedColors.SUCCESS,
        });
    }
}
