import Config from '@Config';
import { Command } from '@class/Command';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { PlayerService } from '@services/PlayerService';
import { VehicleService } from '@services/VehicleService';
import { attachmentFromObject } from '@utils/DiscordHelper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { validatePlate } from '@utils/FiveMHelper';

export class Vehicle extends Command {
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
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        this.EmbedTitle = 'Vehicle Info';

        initCommandOld(
            new SlashCommandBuilder()
                .setName('vehicle')
                .setDescription('Gibt Informationen zu einem Fahrzeug')
                .addStringOption((option) =>
                    option
                        .setName('plate')
                        .setDescription('Kennzeichen des Fahrzeugs')
                        .setRequired(true),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const plate = interaction.options.getString('plate', true);

        const plateValid = validatePlate(plate);
        if (plateValid instanceof Error) {
            await this.replyError(plateValid.message);
            return;
        }

        const vehicle = await VehicleService.getVehicleByPlate(plate);
        if (vehicle instanceof Error) {
            await this.replyError(vehicle.message);
            return;
        }

        const player = await PlayerService.validatePlayer(vehicle.owner);
        if (!player) {
            await this.replyError(`Der Besitzer des Fahrzeugs konnte nicht gefunden werden.`);
            return;
        }

        const file = attachmentFromObject(vehicle, 'VehicleInfo');

        await this.replyWithEmbed({
            description: `Fahrzeug Informationen für das Kennzeichen **${plate}**`,
            fields: [
                {
                    name: 'IC Name Besitzer',
                    value: `${player.playerdata.fullname}`,
                },
                {
                    name: 'Steam Besitzer',
                    value: `${player.steamnames.current} | ${player.identifiers.steam}`,
                },
                {
                    name: 'Besitzer Job',
                    value: `${player.playerdata.job.nameLabel} (${player.playerdata.job.name}) | ${player.playerdata.job.gradeLabel}`,
                },
                {
                    name: 'Fahrzeug Job',
                    value: `${vehicle.job}`,
                },
            ],
            files: [file],
            color: EEmbedColors.SUCCESS,
        });
    }
}

