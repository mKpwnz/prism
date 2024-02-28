import Config from '@Config';
import { Command } from '@class/Command';
import TxAdminClient from '@clients/TxAdminClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class TxAdminWhitelist extends Command {
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
                .setName('txadminwhitelist')
                .setDescription('Setze einen Spieler auf die Whitelist')
                .addStringOption((option) =>
                    option
                        .setName('requestid')
                        .setDescription('Whitelist Request ID')
                        .setRequired(true),
                )
                .addBooleanOption((option) =>
                    option
                        .setName('status')
                        .setDescription('Akzeptieren oder Ablehnen')
                        .setRequired(true),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const requestId = interaction.options.getString('requestid', true);

        const txAdminClient = await TxAdminClient.getInstance();

        await txAdminClient.whitelistRequestSet(requestId, true);

        await this.replyWithEmbed({
            title: 'TxAdmin Whitelist',
            description: `Whitelist erfolgreich freigegeben!\n\n **RequestId:** \`${requestId}\``,
        });
    }
}
