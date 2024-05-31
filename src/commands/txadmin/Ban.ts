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
        .setName('ban')
        .setDescription('Banne einen Spieler über TxAdmin')
        .addStringOption((option) =>
            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('dauer')
                .setDescription('Einheit der Bandauer')
                .setRequired(true)
                .addChoices(
                    { name: '2 Stunden', value: '2 hours' },
                    { name: '8 Stunden', value: '8 hours' },
                    { name: '1 Tag', value: '1 day' },
                    { name: '2 Tage', value: '2 days' },
                    { name: '3 Tage', value: '3 days' },
                    { name: '5 Tage', value: '5 days' },
                    { name: '1 Woche', value: '1 week' },
                    { name: '2 Wochen', value: '2 weeks' },
                    { name: 'Permanent', value: 'permanent' },
                ),
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Grund des Bans').setRequired(false),
        ),
)
export class Ban extends Command {
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
        const duration = interaction.options.getString('dauer', true);
        const reason =
            interaction.options.getString('reason', false) ?? 'Prism: Kein Grund angegeben';

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

        const ban = await TxAdminClient.playerBan(vPlayer, reason, duration);
        if (ban instanceof TxAdminError) {
            await this.replyError(`Fehler beim Bannen des Spielers: \`${ban.message}\``);
            return;
        }
        const fields = [
            {
                name: 'Anzeige Name',
                value: playerInfo.player.displayName,
                inline: true,
            },
            {
                name: 'Beitrittsdatum',
                value: new Date((playerInfo.player.tsJoined ?? 0) * 1000).toLocaleString('de-DE'),
                inline: true,
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: 'Letzte Verbindung',
                value: new Date((playerInfo.player.tsLastConnection ?? 0) * 1000).toLocaleString(
                    'de-DE',
                ),
                inline: true,
            },
            {
                name: 'BanID',
                value: ban,
                inline: true,
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: 'Ban Grund',
                value: `\`\`\`${reason}\`\`\``,
            },
            {
                name: 'Identifier',
                value: `\`\`\`${playerInfo.player.ids.join('\n')}\`\`\``,
            },
        ];
        await this.replyWithEmbed({
            title: 'TxAdmin Ban',
            description: `Spieler erfolgreich gebannt!`,
            fields,
            color: EEmbedColors.ALERT,
        });
    }
}

