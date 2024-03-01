import Config from '@Config';
import { Command } from '@class/Command';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

/**
 * @description Befehl zum Prüfen ob ein Spieler online ist
 * @author sirjxsh
 * @date 09.02.2024
 * @export
 * @class IsOnline
 * @extends {Command}
 */
export class IsOnline extends Command {
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

            Config.Groups.DEV.BOTTEST,
            Config.Groups.PROD.BOT_DEV,
        ];
        initCommandOld(
            new SlashCommandBuilder()
                .setName('isonline')
                .setDescription('Ist ein Spieler online?')
                .addStringOption((option) =>
                    option
                        .setName('spieler')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const player = interaction.options.getString('spieler', true) ?? '';

        if (player === '') {
            await interaction.reply({
                content: `Bitte gib eine SteamID an!`,
                ephemeral: true,
            });
            return;
        }

        const vUser = await PlayerService.validatePlayer(player);
        if (!vUser) {
            await interaction.reply({
                content: `Es konnte kein User mit der SteamID \`${player}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }

        await this.replyWithEmbed({
            title: vUser.metadata.isPlayerOnline
                ? `Spieler ist online ${
                      vUser.metadata.currentID !== -1 ? `| ID: ${vUser.metadata.currentID}` : ''
                  }`
                : 'Spieler ist offline',
            description: `Name: ${vUser.playerdata.fullname}\nTX-Admin: ${vUser.steamnames.current}`,
        });
    }
}
