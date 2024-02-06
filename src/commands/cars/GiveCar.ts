import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import Config from '@Config';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { RconClient } from '@class/RconClient';
import { Helper } from '@utils/Helper';
import { PlayerService } from '@services/PlayerService';

export class GiveCar extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_UNLIMITED,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        this.AllowedUsers = [
            Config.Users.SCHLAUCHI,
        ]
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

            const result = await RconClient.sendCommand(
                `givecardiscord ${vPlayer.identifiers.steam} ${vehicle} ${formattedPlate}`,
            );
            await this.replyWithEmbed({
                interaction,
                title: embedTitle,
                description: result,
                color: EEmbedColors.SUCCESS,
            });
        } else {
            const result = await RconClient.sendCommand(`givecardiscord ${vPlayer.identifiers.steam} ${vehicle} random`);
            await this.replyWithEmbed({
                interaction,
                title: embedTitle,
                description: result,
                color: EEmbedColors.SUCCESS,
            });
        }
    }
}
