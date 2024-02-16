import Config from '@Config';
import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { VehicleService } from '@services/VehicleService';
import { GameDB } from '@sql/Database';
import { Helper } from '@utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

export class ChangePlate extends Command {
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

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        this.AllowedUsers = [
            Config.Users.SCHLAUCHI,
            Config.Users.LUCASJHW,
            Config.Users.JUNGLEJANIS,
        ];

        RegisterCommand(
            new SlashCommandBuilder()
                .setName('changeplate')
                .setDescription('Löscht das Fahrzeug')
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
            this,
        );
    }

    // @TODO: Rewrite to Service structure
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const oldplate = interaction.options.getString('oldplate', true);
        const newplate = interaction.options.getString('newplate', true);

        if (oldplate.length > 8) {
            await this.replyError(
                `Das Kennzeichen **${oldplate}** ist zu lang. \nDas Kennzeichen darf maximal 8 Zeichen lang sein.`,
            );
            return;
        }
        if (newplate.length > 8) {
            await this.replyError(
                `Das Kennzeichen **${newplate}** ist zu lang. \nDas Kennzeichen darf maximal 8 Zeichen lang sein.`,
            );
            return;
        }
        if (!newplate.toUpperCase().match(/^[A-Z0-9 ]*$/g)) {
            await this.replyError(
                `Das Kennzeichen **${newplate}** enthält ungültige Zeichen. \nDas Kennzeichen darf nur aus Buchstaben und Zahlen bestehen.`,
            );

            return;
        }
        await interaction.deferReply();

        const newplatefmt = Helper.formatNumberplate(newplate);
        const vehicle = await VehicleService.getVehicleByNumberplate(oldplate);
        if (!vehicle) {
            await this.replyError(
                `Es wurden keine Fahrzeuge mit dem Kennzeichen ${oldplate} gefunden.`,
            );
            return;
        }
        if (vehicle.garage < 0) {
            await this.replyError(
                `Das Fahrzeug mit dem Kennzeichen **${oldplate}** ist nicht in einer Garage geparkt und kann daher nicht bearbeitet werden.`,
            );
            return;
        }
        const newplatevehicle = await VehicleService.getVehicleByNumberplate(newplate);
        if (newplatevehicle) {
            await this.replyError(
                `Es existiert bereits ein Fahrzeug mit dem Kennzeichen ${newplate}.`,
            );

            return;
        }
        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE owned_vehicles SET plate = ?, vehicle = JSON_SET(vehicle, '$.plate', ?) WHERE plate = ?`,
            [newplatefmt, newplatefmt, vehicle.plate],
        );
        if (res.affectedRows === 0) {
            await this.replyError(
                `Es ist ein Fehler aufgetreten. Des Fahrzeug mit dem Kennzeichen ${oldplate} konnte nicht bearbeitet werden.`,
            );
            return;
        }
        await RconClient.sendCommand(`unloadtrunk ${oldplate}`);
        await RconClient.sendCommand(`debugtrunk ${oldplate}`);
        await this.replyWithEmbed({
            description: `Das Fahrzeugs mit dem Kennzeichen **${oldplate}** hat nun das Kennzeichen **${newplatefmt}**.`,
            color: EEmbedColors.SUCCESS,
        });
    }
}
