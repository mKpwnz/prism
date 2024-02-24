import Config from '@Config';
import { Command } from '@class/Command';
import { TxAdminBanRequest, TxAdminClient } from '@clients/TxAdminClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
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
                    option.setName('duration').setDescription('Dauer des Bans').setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('identifier')
                        .setDescription('Identifier des Spielers')
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('reason').setDescription('Grund des Bans').setRequired(false),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const identifier = interaction.options.getString('identifier', true);
        const duration = interaction.options.getString('duration', true);
        const reason =
            interaction.options.getString('reason', false) || 'Prism: Kein Grund angegeben';

        // duration needs to be properly mapped to what txadmin expects
        // possible values are: 'permanent', 'x hour(s)', 'x day(s)', 'x week(s)', 'x week(s)'

        const txAdminClient = await TxAdminClient.getInstance();

        const request: TxAdminBanRequest = {
            reason,
            duration,
            identifiers: [identifier],
        };

        const banResponse = await txAdminClient.banIds(request);

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
