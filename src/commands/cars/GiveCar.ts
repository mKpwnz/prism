import Config from '@Config';
import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { PlayerService } from '@services/PlayerService';
import { VehicleService } from '@services/VehicleService';
import { Helper } from '@utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class GiveCar extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [Config.Groups.PROD.BOT_DEV, Config.Groups.DEV.BOTTEST];
        this.AllowedUsers = [Config.Users.SCHLAUCHI];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('givecar')
                .setDescription('Schenke einem Spieler ein Fahrzeug')
                .addStringOption((option) =>
                    option
                        .setName('steamid')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('vehicle')
                        .setDescription('Der Name des Fahrzeugs')
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('plate')
                        .setDescription('Das (optionale) Kennzeichen des Fahrzeugs')
                        .setRequired(false),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const embedTitle = 'Fahrzeug schenken';

        const steamId = interaction.options.getString('steamid', true);
        const vehicle = interaction.options.getString('vehicle', true);
        const plate = interaction.options.getString('plate', false);

        const vPlayer = await PlayerService.validatePlayer(steamId);
        if (!vPlayer) {
            await interaction.reply({
                content: `Es konnte kein Spieler mit der SteamID \`${steamId}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }

        if (plate) {
            const formattedPlate = Helper.formatNumberplate(plate);

            if (!formattedPlate) {
                await this.replyWithEmbed({
                    interaction,
                    title: embedTitle,
                    description: `Das Kennzeichen \`${plate}\` ist ungültig.`,
                    color: EEmbedColors.ALERT,
                });
                return;
            }

            if (VehicleService.getVehicleByNumberplate(formattedPlate) == null) {
                await this.replyWithEmbed({
                    interaction,
                    title: embedTitle,
                    description: `Es gibt schon das Kennzeichen \`${formattedPlate}\`.`,
                    color: EEmbedColors.ALERT,
                });
            }

            let result = await RconClient.sendCommand(
                `givecardiscord ${vPlayer.identifiers.steam} ${vehicle} ${formattedPlate}`,
            );

            const car = await VehicleService.getNewestVehicleByOwner(vPlayer.identifiers.steam);
            if (car != null) {
                result = `\n\nDas Fahrzeug hat das Kennzeichen \`${car.plate}\``;
            }
            await this.replyWithEmbed({
                interaction,
                title: embedTitle,
                description: result,
                color: EEmbedColors.SUCCESS,
            });
        } else {
            await RconClient.sendCommand(
                `givecardiscord ${vPlayer.identifiers.steam} ${vehicle} random`,
            );
            let result: string;

            const car = await VehicleService.getNewestVehicleByOwner(vPlayer.identifiers.steam);
            if (car != null) {
                const inserted = new Date(car.inserted);
                if (inserted > new Date(Date.now() - 1000 * 60)) {
                    result = `Das Fahrzeug wurde erstellt und hat das Kennzeichen \`${car.plate}\`.`;
                } else {
                    await this.replyWithEmbed({
                        interaction,
                        title: embedTitle,
                        description: `Das Fahrzeug konnte nicht erstellt werden.`,
                        color: EEmbedColors.ALERT,
                    });
                    return;
                }
            } else {
                await this.replyWithEmbed({
                    interaction,
                    title: embedTitle,
                    description: `Das Fahrzeug konnte nicht erstellt werden.`,
                    color: EEmbedColors.ALERT,
                });
                return;
            }

            await this.replyWithEmbed({
                interaction,
                title: embedTitle,
                description: result,
                color: EEmbedColors.SUCCESS,
            });
        }
    }
}
