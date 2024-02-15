import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { PlayerService } from '@services/PlayerService';
import { VehicleService } from '@services/VehicleService';
import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import * as prettier from 'prettier';

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

        RegisterCommand(
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

    // @TODO: Rewrite to Service structure
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const plate = interaction.options.getString('plate');

        if (!plate) {
            throw new Error('Plate is required');
        }
        if (plate.length > 8) {
            await this.replyWithEmbed({
                interaction,
                title: 'Vehicle Info',
                description: `Das Kennzeichen **${plate}** ist zu lang. \nDas Kennzeichen darf maximal 8 Zeichen lang sein.`,
                color: EEmbedColors.ALERT,
            });
            return;
        }
        await interaction.deferReply();

        const vehicle = await VehicleService.getVehicleByNumberplate(plate);
        if (!vehicle) {
            await this.replyWithEmbed({
                interaction,
                title: 'Vehicle Info',
                description: `Es wurden keine Fahrzeuge mit dem Kennzeichen ${plate} gefunden.`,
                color: EEmbedColors.ALERT,
            });
            return;
        }
        const jsonString = JSON.stringify(vehicle, null, 4);
        const buffer = Buffer.from(jsonString, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
            name: `PRISM_VehicleInfo_${plate}_${new Date().toLocaleString('de-DE')}.json`,
        });
        const player = await PlayerService.validatePlayer(vehicle.owner);
        if (!player) {
            await this.replyWithEmbed({
                interaction,
                title: 'Vehicle Info',
                description: `Der Besitzer des Fahrzeugs konnte nicht gefunden werden.`,
                color: EEmbedColors.ALERT,
            });
            return;
        }
        console.log(vehicle);
        await this.replyWithEmbed({
            interaction,
            title: 'Vehicle Info',
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
                    value: `${player.playerdata.job.nameLabel} | ${player.playerdata.job.gradeLabel}`,
                },
                {
                    name: 'Fahrzeug Job',
                    value: `${vehicle.job}`,
                },
                {
                    name: 'Handschhuhfach',
                    value: `\`\`\`json\n${await prettier.format(vehicle.handschuhfach || '{}', {
                        parser: 'json5',
                    })}\`\`\``,
                },
                {
                    name: 'Kofferraum',
                    value: `\`\`\`json\n${await prettier.format(vehicle.kofferraum || '{}', {
                        parser: 'json5',
                    })}\`\`\``,
                },
            ],
            files: [attachment],
            color: EEmbedColors.SUCCESS,
        });
    }
}
