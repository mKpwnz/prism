import Config from '@Config';
import { Command } from '@class/Command';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { attachmentFromObject } from '@utils/DiscordHelper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { VehicleService } from '@services/VehicleService';

export class VehiclePop extends Command {
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

        initCommandOld(
            new SlashCommandBuilder()
                .setName('vehiclepop')
                .setDescription('VehiclePop')
                .addStringOption((option) =>
                    option
                        .setName('spawnname')
                        .setDescription('Spawnname des Fahrzeugs')
                        .setRequired(true),
                )
                .addBooleanOption((option) =>
                    option.setName('noexport').setDescription('Ohne Export, nur zählen'),
                ),

            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const spawnname = interaction.options.getString('spawnname', true);
        const noexport = interaction.options.getBoolean('noexport') ?? false;

        const vehicles = await VehicleService.getVehiclesBySpawnName(spawnname);
        if (vehicles instanceof Error) {
            await this.replyError(vehicles.message);
            return;
        }

        const attachments = [];
        if (!noexport) {
            const reponseList = [];
            for (const vehicle of vehicles) {
                const vehData = JSON.parse(vehicle.vehicle);
                reponseList.push({
                    owner: vehicle.owner,
                    plate: vehicle.plate,
                    garage: vehicle.garage,
                    model: vehData.model,
                    modelName: vehData.modelName,
                    modTurbo: vehData.modTurbo,
                    modEngine: vehData.modEngine,
                    modTransmission: vehData.modTransmission,
                    modSuspension: vehData.modSuspension,
                });
            }
            attachments.push(attachmentFromObject(reponseList, 'VehiclePopBackup'));
        }

        await this.replyWithEmbed({
            description: `Es wurden **${vehicles.length} Fahrzeuge** mit dem Spawnnamen **${spawnname}** gefunden.`,
            color: EEmbedColors.SUCCESS,
            files: attachments,
        });
    }
}
