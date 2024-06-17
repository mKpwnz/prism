import Config from '@prism/Config';
import Command from '@prism/class/Command';
import TxAdminClient from '@prism/clients/TxAdminClient';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import TxAdminError from '@prism/error/TxAdmin.error';
import LogManager from '@prism/manager/LogManager';
import { PlayerService } from '@prism/services/PlayerService';
import { paginateApiResponse } from '@prism/utils/DiscordHelper';
import { Helper } from '@prism/utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('txhistory')
        .setDescription('Zeigt die Aktionen eines Spielers über TxAdmin')
        .addStringOption((option) =>
            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
        )
        .addIntegerOption((option) => option.setName('page').setDescription('Seite')),
)
export class TxHistory extends Command {
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
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const page = interaction.options.getInteger('page') ?? 1;
        const steamid = interaction.options.getString('steamid', true);
        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyWithEmbed({
                description: `Spieler nicht gefunden! Prüfe deine Eingabe und versuche es erneut.`,
                ephemeral: true,
            });
            return;
        }

        const playerInfo = await TxAdminClient.getPlayerInfo(vPlayer);
        if (playerInfo instanceof TxAdminError) {
            LogManager.error(playerInfo);
            await this.replyError(`\`${playerInfo}\``);
            return;
        }

        const pages = paginateApiResponse(
            playerInfo.player.actionHistory.reverse(),
            (res) => {
                const lines = [];
                const exp = res.exp ? new Date(res.exp * 1000).toLocaleString('de-DE') : 'N/A';
                const ts = new Date(res.ts * 1000).toLocaleString('de-DE');
                lines.push(`Action **${res.id}**`);
                lines.push('```');
                lines.push(`Type: ${res.type}`);
                lines.push(`Reason: ${res.reason}`);
                if (res.type === 'ban' && res.exp) {
                    const duration = res.exp - res.ts;
                    lines.push(`Von: ${ts}`);
                    lines.push(`Bis: ${exp}`);
                    lines.push(`Dauer: ${Helper.secondsToTimeString(duration)}`);
                } else {
                    lines.push(`Datum: ${ts}`);
                }
                if (res.type === 'ban' && res.revokedBy && res.revokedAt) {
                    lines.push(`Aufgehoben von: ${res.revokedBy}`);
                    lines.push(
                        `Aufgehoben am: ${new Date(res.revokedAt * 1000).toLocaleString('de-DE')}`,
                    );
                }
                lines.push('```');
                return lines.join('\n');
            },
            2000,
        );

        if (page > pages.length || page < 1) {
            await this.replyError(`Seite ${page} existiert nicht.`);
            return;
        }

        await this.replyWithEmbed({
            title: `TxAdmin History von **${vPlayer.playerdata.fullname}** ( Seite ${page} von ${pages.length} )`,
            description: pages[page - 1],
        });
    }
}
