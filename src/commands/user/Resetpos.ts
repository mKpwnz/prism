import Config from '@Config';
import { Command } from '@class/Command';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
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
        initCommandOld(
            new SlashCommandBuilder()
                .setName('resetpos')
                .setDescription('Setze die Position eines Spielers zum Würfelpark zurück')
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
        const steam = interaction.options.getString('steam', true);
        const vPlayer = await PlayerService.validatePlayer(steam);

        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
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
                await this.replyWithEmbed({
                    description: `Die Position von ${vPlayer.playerdata.fullname} (${vPlayer.identifiers.steam}) wurde zurückgesetzt.`,
                });
            } else {
                await this.replyError('Der Versuch, die Position zu ändern, ist fehlgeschlagen!');
            }
        } catch (error) {
            await this.replyError('Es ist ein Fehler aufgetreten!');
        }
    }
}
