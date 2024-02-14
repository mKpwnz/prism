import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { PlayerService } from '@services/PlayerService';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import { GameDB } from '@sql/Database';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { RowDataPacket } from 'mysql2';

export class Resetpos extends Command {
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
        this.IsBetaCommand = true;
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('resetpos')
                .setDescription('Setze die Position eines Spielers zum Würfelpark zurück')
                // add string option
                .setDMPermission(true)
                .addStringOption((option) =>
                    option
                        .setName('steam')
                        .setDescription('Steam ID des Nutzers')
                        .setRequired(true),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const steam = interaction.options.get('steam')?.value?.toString() ?? '';
        const vPlayer = await PlayerService.validatePlayer(steam);
        const embed = Command.getEmbedTemplate(interaction);
        if (!vPlayer) {
            await interaction.reply('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }
        try {
            const newPosition = Config.Commands.Resetpos.DefaultPosition;
            const query = 'UPDATE users SET position = ? WHERE identifier = ?';
            const result = (await GameDB.execute(query, [
                JSON.stringify(newPosition),
                vPlayer.identifiers.steam,
            ])) as RowDataPacket[];
            if (result[0].rowsChanged !== 0) {
                embed.setTitle('Position zurückgesetzt');
                embed.setDescription(
                    `Die Position von ${vPlayer.playerdata.fullname} (${vPlayer.identifiers.steam}) wurde zurückgesetzt.`,
                );
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({
                    content: 'Der Versuch, die Position zu ändern, ist fehlgeschlagen!',
                    ephemeral: true,
                });
            }
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }
}
