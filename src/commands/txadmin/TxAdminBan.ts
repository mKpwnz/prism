import Config from '@Config';
import { Command } from '@class/Command';
import TxAdminClient from '@clients/TxAdminClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class TxAdminBan extends Command {
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
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('txadminban')
                .setDescription('Banne einen Spieler über TxAdmin')
                .addStringOption((option) =>
                    option
                        .setName('identifier')
                        .setDescription('Identifier des Spielers')
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('unit')
                        .setDescription('Einheit der Bandauer')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Permanent', value: 'permanent' },
                            { name: 'Stunden', value: 'hours' },
                            { name: 'Tage', value: 'days' },
                            { name: 'Wochen', value: 'weeks' },
                            { name: 'Monate', value: 'months' },
                        ),
                )
                .addNumberOption((option) =>
                    option
                        .setName('duration')
                        .setDescription('Dauer des Bans (optional bei Permanent)')
                        .setRequired(false),
                )
                .addStringOption((option) =>
                    option.setName('reason').setDescription('Grund des Bans').setRequired(false),
                ),
            this,
        );
    }

    /**
     * @description Maps the duration and unit to the TxAdmin format
     * @returns The duration in the TxAdmin format or null if it is invalid
     */
    private mapDurationToTxAdminFormat(duration: number | null, unit: string): string | null {
        if (unit === 'permanent') {
            return unit;
        }
        if (unit !== 'permanent' && !duration) {
            return null;
        }
        return `${duration} ${unit}`;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const identifier = interaction.options.getString('identifier', true);
        const unit = interaction.options.getString('unit', true);
        const duration = interaction.options.getNumber('duration', false);
        const reason =
            interaction.options.getString('reason', false) || 'Prism: Kein Grund angegeben';

        const txAdminDuration = this.mapDurationToTxAdminFormat(duration, unit);

        if (!txAdminDuration) {
            await this.replyWithEmbed({
                title: 'TxAdmin Ban',
                description: `Bitte gib eine Dauer für den Ban an, oder banne den Spieler Permanent!`,
                ephemeral: true,
            });
            return;
        }

        const txAdminClient = await TxAdminClient.getInstance();

        const player = await PlayerService.validatePlayer(identifier);

        if (!player) {
            await this.replyWithEmbed({
                title: 'TxAdmin Ban',
                description: `Spieler nicht gefunden! Prüfe deine Eingabe und versuche es erneut.`,
                ephemeral: true,
            });
            return;
        }

        const banResponse = await txAdminClient.playerBan(player, reason, txAdminDuration);

        if (banResponse.success) {
            await this.replyWithEmbed({
                title: 'TxAdmin Ban',
                description: `Spieler erfolgreich gebannt!\n\n **Identifier:** \`${identifier}\`\n **Dauer:** \`${duration}\`\n **Grund:** \`${reason}\`\n`,
            });
        } else {
            await this.replyWithEmbed({
                title: 'TxAdmin Ban',
                description: `Fehler beim Bannen des Spielers! Prüfe die Logs für mehr Informationen.`,
                ephemeral: true,
            });
        }
    }
}
