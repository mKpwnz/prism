import Config from '@prism/Config';
import Command from '@prism/class/Command';
import TxAdminClient from '@prism/clients/TxAdminClient';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { EEmbedColors } from '@prism/enums/EmbedColors';
import TxAdminError from '@prism/error/TxAdmin.error';
import LogManager from '@prism/manager/LogManager';
import { PlayerService } from '@prism/services/PlayerService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('txinfo')
        .setDescription('Zeigt Informationen zu einem Spieler über TxAdmin')
        .addStringOption((option) =>
            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
        ),
)
export class TxInfo extends Command {
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
        const steamid = interaction.options.getString('steamid', true);
        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError(
                `Spieler nicht gefunden! Prüfe deine Eingabe und versuche es erneut.`,
            );
            return;
        }

        const playerInfo = await TxAdminClient.getPlayerInfo(vPlayer);
        if (playerInfo instanceof TxAdminError) {
            LogManager.error(playerInfo);
            await this.replyError(`\`${playerInfo}\``);
            return;
        }
        const { player } = playerInfo;
        const banCount = player.actionHistory.reduce(
            (acc, cur) => (cur.type === 'ban' ? acc + 1 : acc),
            0,
        );
        const warnCount = player.actionHistory.reduce(
            (acc, cur) => (cur.type === 'warn' ? acc + 1 : acc),
            0,
        );
        const actionCount = banCount + warnCount;
        const fields = [
            {
                name: 'Anzeige Name',
                value: player.displayName,
                inline: true,
            },
            {
                name: 'Beitrittsdatum',
                value: new Date((player.tsJoined ?? 0) * 1000).toLocaleString('de-DE'),
                inline: true,
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: 'Whitelist Datum',
                value: new Date((player.tsWhitelisted ?? 0) * 1000).toLocaleString('de-DE'),
                inline: true,
            },
            {
                name: 'Letzte Verbindung',
                value: new Date((player.tsLastConnection ?? 0) * 1000).toLocaleString('de-DE'),
                inline: true,
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: 'Anzahl Bans',
                value: banCount.toString(),
                inline: true,
            },
            {
                name: 'Anzahl Warns',
                value: warnCount.toString(),
                inline: true,
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: 'Identifier',
                value: `\`\`\`${player.ids.join('\n')}\`\`\``,
            },
        ];

        let color;
        if (actionCount === 0) {
            color = EEmbedColors.SUCCESS;
        } else if (actionCount > 0 && actionCount < 3) {
            color = EEmbedColors.DEFAULT;
        } else if (actionCount >= 3 && actionCount < 5) {
            color = EEmbedColors.WARNING;
        } else {
            color = EEmbedColors.ALERT;
        }

        await this.replyWithEmbed({
            description: `TxAdmin Informationen zu **${vPlayer.playerdata.fullname}** ( ${vPlayer.identifiers.steam} )`,
            fields,
            color,
        });
    }
}

