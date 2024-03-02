import Config from '@Config';
import Command from '@class/Command';
import TxAdminClient from '@clients/TxAdminClient';
import { RegisterCommand } from '@decorators';
import { EENV } from '@enums/EENV';
import TxAdminError from '@error/TxAdmin.error';
import LogManager from '@manager/LogManager';
import { PlayerService } from '@services/PlayerService';
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
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamid = interaction.options.getString('steamid', true);
        const duration = interaction.options.getString('dauer', true);
        const reason =
            interaction.options.getString('reason', false) ?? 'Prism: Kein Grund angegeben';

        const player = await PlayerService.validatePlayer(steamid);

        if (!player) {
            await this.replyWithEmbed({
                title: 'TxAdmin Ban',
                description: `Spieler nicht gefunden! Prüfe deine Eingabe und versuche es erneut.`,
                ephemeral: true,
            });
            return;
        }

        const ban = await TxAdminClient.playerBan(player, reason, duration);
        const history = await TxAdminClient.getPlayerInfo(player);
        LogManager.debug(history);
        if (ban instanceof TxAdminError) {
            await this.replyError(`Fehler beim Bannen des Spielers: \`${ban.message}\``);
            return;
        }

        await this.replyWithEmbed({
            title: 'TxAdmin Ban',
            description: `Spieler erfolgreich gebannt!\n\n **Identifier:** \`${steamid}\`\n **Dauer:** \`${duration}\`\n **Grund:** \`${reason}\`\n **ActionID:** \`${ban}\``,
        });
    }
}

