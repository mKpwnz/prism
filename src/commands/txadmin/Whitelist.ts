import Config from '@Config';
import { Command } from '@class/Command';
import TxAdminClient from '@clients/TxAdminClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Whitelist extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.TEAM_WHITELIST_REQUEST,

            Config.Channels.PROD.PRISM_TESTING,
            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.TEAM_INHABER,
            Config.Groups.PROD.TEAM_PROJEKTLEITUNG,
            Config.Groups.PROD.TEAM_STLV_PROJEKTLEITUNG,
            Config.Groups.PROD.TEAM_SERVERLEITUNG,
            Config.Groups.PROD.TEAM_HEAD_DEVELOPER,
            Config.Groups.PROD.TEAM_SERVER_ENGINEER,
            Config.Groups.PROD.TEAM_WHITELIST_HELFER,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('whitelist')
                .setDescription('Setze einen Spieler auf die Whitelist')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('accept')
                        .setDescription('Akzeptiere eine Whitelist Anfrage')
                        .addStringOption((option) =>
                            option
                                .setName('requestid')
                                .setDescription('Whitelist Request ID')
                                .setMinLength(5)
                                .setMaxLength(5)
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('deny')
                        .setDescription('Akzeptiere eine Whitelist Anfrage')
                        .addStringOption((option) =>
                            option
                                .setName('requestid')
                                .setDescription('Whitelist Request ID')
                                .setMinLength(5)
                                .setMaxLength(5)
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('info')
                        .setDescription('Zeige Informationen zu einem Whitelist Request')
                        .addStringOption((option) =>
                            option
                                .setName('requestid')
                                .setDescription('Whitelist Request ID')
                                .setMinLength(5)
                                .setMaxLength(5)
                                .setRequired(true),
                        ),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const requestId = interaction.options.getString('requestid', true);

        switch (interaction.options.getSubcommand()) {
            case 'accept':
                await this.processRequest(requestId, 'approve');
                break;
            case 'deny':
                await this.processRequest(requestId, 'deny');
                break;
            case 'info':
                await this.getWhitelistInfo(requestId);
                break;
            default:
                await this.replyError('Ungültiger Command');
        }
    }

    async getWhitelistInfo(requestId: string): Promise<void> {
        const whitelistRequest = await TxAdminClient.getWhitelistRequestById(requestId);
        if (!whitelistRequest) {
            await this.replyError('Whitelist Request nicht gefunden');
            return;
        }

        let discordId = 'Nicht verfügbar';
        if (whitelistRequest.discordAvatar) {
            const discordIdSplit = whitelistRequest.discordAvatar?.split('/');
            discordId = `<@${discordIdSplit[discordIdSplit.length - 2]}>`;
        }

        await this.replyWithEmbed({
            title: 'TxAdmin Whitelist',
            description: ` `,
            fields: [
                {
                    name: 'Request ID',
                    value: whitelistRequest.id,
                },
                {
                    name: 'FiveM / Steam Name',
                    value: whitelistRequest.playerDisplayName,
                },
                {
                    name: 'Discord Tag',
                    value: `${whitelistRequest.discordTag} (${discordId})`,
                },
                {
                    name: 'Timestamp',
                    value: new Date(whitelistRequest.tsLastAttempt * 1000).toLocaleString('de-DE'),
                },
            ],
        });
    }

    async processRequest(requestId: string, status: 'approve' | 'deny'): Promise<void> {
        const whitelistRequest = await TxAdminClient.getWhitelistRequestById(requestId);
        if (!whitelistRequest) {
            await this.replyError('Whitelist Request nicht gefunden');
            return;
        }
        await TxAdminClient.handleWhitelistRequest(requestId, status);

        let discordId = 'Nicht verfügbar';
        if (whitelistRequest.discordAvatar) {
            const discordIdSplit = whitelistRequest.discordAvatar?.split('/');
            discordId = `<@${discordIdSplit[discordIdSplit.length - 2]}>`;
        }

        await this.replyWithEmbed({
            title: 'TxAdmin Whitelist',
            description: status === 'approve'
                ? 'Whitelist erfolgreich freigegeben'
                : 'Whitelist erfolgreich abgelehnt',
            color: status ? EEmbedColors.SUCCESS : EEmbedColors.ALERT,
            fields: [
                {
                    name: 'Request ID',
                    value: whitelistRequest.id,
                },
                {
                    name: 'FiveM / Steam Name',
                    value: whitelistRequest.playerDisplayName,
                },
                {
                    name: 'Discord Tag',
                    value: `${whitelistRequest.discordTag} (${discordId})`,
                },
                {
                    name: 'Timestamp',
                    value: new Date(whitelistRequest.tsLastAttempt * 1000).toLocaleString('de-DE'),
                },
            ],
        });
    }
}
