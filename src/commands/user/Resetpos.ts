import { Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import LogManager from '@prism/manager/LogManager';
import { PlayerService } from '@prism/services/PlayerService';
import { GameDB } from '@prism/sql/Database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { RowDataPacket } from 'mysql2';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('resetpos')
        .setDescription('Setze die Position eines Spielers zum Würfelpark zurück')
        .addStringOption((option) =>
            option.setName('steam').setDescription('Steam ID des Nutzers').setRequired(true),
        ),
)
export class Resetpos extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.BOT_DEV,
        ];
        this.IsBetaCommand = true;
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
            Sentry.captureException(error);
            LogManager.error(error);
            await this.replyError('Es ist ein Fehler aufgetreten!');
        }
    }
}
