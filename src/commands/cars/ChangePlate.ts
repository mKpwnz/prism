import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { VehicleService } from '@services/VehicleService';
import { formatNumberplate } from '@utils/FiveMHelper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

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

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const oldplate = interaction.options.getString('oldplate', true);
        const newplate = interaction.options.getString('newplate', true);
        await interaction.deferReply();
        const result = await VehicleService.changeVehiclePlate(oldplate, newplate);
        if (result instanceof Error) {
            await this.replyError(result.message);
            return;
        }
        await this.replyWithEmbed({
            description: `Das Fahrzeugs mit dem Kennzeichen **${oldplate}** hat nun das Kennzeichen **${formatNumberplate(
                newplate,
            )}**.`,
            color: EEmbedColors.SUCCESS,
        });
    }
}
