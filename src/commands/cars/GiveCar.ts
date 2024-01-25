import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import Config from '@Config';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { RconClient } from '@class/RconClient';
import { Helper } from '@utils/Helper';

export class ValidateTrunk extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_UNLIMITED,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.DEV.BOTTEST,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('givecar')
                .setDescription('Schenke einem Spieler ein Fahrzeug')
                .addStringOption((option) =>
                    option
                        .setName('player')
                        .setDescription('Der Identifier des Spielers')
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

        const player = interaction.options.getString('player', true);
        const vehicle = interaction.options.getString('vehicle', true);
        const plate = interaction.options.getString('plate', false);

        // TODO check if vehicle exists or is allowed?

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


            await RconClient.sendCommand(`givecarplate ${player} ${vehicle} ${formattedPlate}`);
            await this.replyWithEmbed({
                interaction,
                title: embedTitle,
                description: `Das Fahrzeug mit dem Namen \`${vehicle}\` und dem Kennzeichen \`${formattedPlate}\` wurde erfolgreich erstellt.`,
                color: EEmbedColors.SUCCESS,
            });
        } else {
            await RconClient.sendCommand(`givecar ${player} ${vehicle}`);
            await this.replyWithEmbed({
                interaction,
                title: embedTitle,
                description: `Das Fahrzeug mit dem Namen \`${vehicle}\` wurde erfolgreich erstellt.`,
                color: EEmbedColors.SUCCESS,
            });
        }

    }
}
