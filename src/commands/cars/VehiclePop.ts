import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { GameDB } from '@sql/Database';
import { IVehicle } from '@sql/schema/Vehicle.schema';
import { Helper } from '@utils/Helper';
import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

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

        RegisterCommand(
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
                    option.setName('exportjson').setDescription('Exportiere die Daten'),
                ),

            this,
        );
    }

    // @TODO: Rewrite to Service structure
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const spawnname = interaction.options.getString('spawnname');
        const exportjson = interaction.options.getBoolean('exportjson');

        if (!spawnname) {
            throw new Error('Spawnname is required');
        }
        const hash = Helper.generateOAAThash(spawnname);

        await interaction.deferReply();

        const [vehicles] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE JSON_EXTRACT(vehicle, '$.modelName') = ? OR JSON_EXTRACT(vehicle, '$.model') = ?`,
            [spawnname, hash],
        );

        if (!vehicles.length) {
            await this.replyWithEmbed({
                interaction,
                title: 'VehiclePop',
                color: EEmbedColors.ALERT,
                description: `Es konnten keine Fahrzeuge mit dem Spawnname **${spawnname}** gefunden werden.`,
            });
            return;
        }
        const attachments = [];
        if (exportjson) {
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
            const jsonString = JSON.stringify(reponseList, null, 4);
            const buffer = Buffer.from(jsonString, 'utf-8');
            attachments.push(
                new AttachmentBuilder(buffer, {
                    name: `PRISM_VehiclePop_${new Date().toLocaleString('de-DE')}.json`,
                }),
            );
        }

        await this.replyWithEmbed({
            interaction,
            title: 'VehiclePop',
            description: `Es wurden **${vehicles.length} Fahrzeuge** mit dem Spawnnamen **${spawnname}** gefunden.`,
            color: EEmbedColors.SUCCESS,
            files: attachments,
        });
    }
}
