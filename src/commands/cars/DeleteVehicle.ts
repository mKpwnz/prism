import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { VehicleService } from '@services/VehicleService';
import { GameDB } from '@sql/Database';
import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

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

        RegisterCommand(
            new SlashCommandBuilder()
                .setName('deletevehicle')
                .setDescription('Löscht das Fahrzeug')
                .addStringOption((option) =>
                    option
                        .setName('plate')
                        .setDescription('Kennzeichen des Fahrzeugs')
                        .setRequired(true),
                ),
            this,
        );
    }

    // @TODO: Rewrite to Service structure
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const plate = interaction.options.getString('plate', true);

        if (plate.length > 8) {
            await this.replyError(
                `Das Kennzeichen **${plate}** ist zu lang. \nDas Kennzeichen darf maximal 8 Zeichen lang sein.`,
            );
            return;
        }
        await interaction.deferReply();
        const vehicle = await VehicleService.getVehicleByNumberplate(plate);
        if (!vehicle) {
            await this.replyError(
                `Es wurden keine Fahrzeuge mit dem Kennzeichen ${plate} gefunden.`,
            );
            return;
        }
        const jsonString = JSON.stringify(vehicle, null, 4);
        const buffer = Buffer.from(jsonString, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
            name: `PRISM_DeleteVehicleBackup_${plate}_${new Date().toLocaleString('de-DE')}.json`,
        });
        const [res] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM owned_vehicles WHERE plate = ?`,
            [vehicle.plate],
        );
        if (res.affectedRows === 0) {
            await this.replyError(
                `Es ist ein Fehler aufgetreten. Des Fahrzeug mit dem Kennzeichen ${plate} konnte nicht gelöscht werden.`,
            );
            return;
        }
        await this.replyWithEmbed({
            description: `Das Fahrzeugs mit dem Kennzeichen **${plate}** wurde erfolgreich gelöscht.`,
            color: EEmbedColors.SUCCESS,
            files: [attachment],
        });
    }
}
