import Config from '@Config';
import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ILivePlayer } from '@interfaces/ILivePlayer';
import { EmoteManager } from '@manager/EmoteManager';
import { NvhxService } from '@services/NvhxService';
import { PlayerService } from '@services/PlayerService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Nvhx extends Command {
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
                .setName('nvhx')
                .setDescription('Neverhax Commands')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('sc')
                        .setDescription('Triggert Neverhax Screenshot')
                        .addIntegerOption((option) =>
                            option.setName('id').setDescription('SpielerID').setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('unban')
                        .setDescription('Entbanne einen Nutzer')
                        .addStringOption((option) =>
                            option
                                .setName('banid')
                                .setDescription('BanID des Banns')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand.setName('checkplayerbans').setDescription('Triggert Neverhax Info'),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.guildId) return;
        switch (interaction.options.getSubcommand()) {
            case 'sc':
                await this.captureScreenByPlayerId(interaction);
                break;
            case 'unban':
                await this.unbanPlayerById(interaction);
                break;
            case 'checkplayerbans':
                await this.getBannedLivePlayers(interaction);
                break;
            default:
                await interaction.reply({
                    content: 'Command nicht gefunden.',
                    ephemeral: true,
                });
        }
    }

    private async captureScreenByPlayerId(interaction: ChatInputCommandInteraction): Promise<void> {
        const id = interaction.options.getInteger('id', true);
        await RconClient.sendCommand(`nvhx sc ${id}`);
        await this.replyWithEmbed({
            title: 'Neverhax Screenshot',
            description: `Triggere Neverhax Screenshot für SpielerID ${id}`,
        });
    }

    private async unbanPlayerById(interaction: ChatInputCommandInteraction): Promise<void> {
        const banId = interaction.options.getString('banid', true);
        const response = await RconClient.sendCommand(`nvhx unban ${banId}`);

        if (response.includes('Unbanned: ')) {
            await this.replyWithEmbed({
                title: 'Neverhax Unban',
                description: `Entbanne BanID ${banId}`,
            });
        } else {
            await this.replyWithEmbed({
                title: 'Neverhax Unban',
                description: `BanID nicht gefunden!`,
                ephemeral: true,
            });
        }
    }

    private async getBannedLivePlayers(interaction: ChatInputCommandInteraction): Promise<void> {
        const bannedPlayers = await this.fetchBannedLivePlayers();
        const description = await this.formatBannedPlayersDescription(bannedPlayers, interaction);
        await this.replyWithEmbed({
            title: 'Neverhax Info',
            description,
        });
    }

    private async fetchBannedLivePlayers(): Promise<ILivePlayer[]> {
        const livePlayers = await PlayerService.getAllLivePlayers();

        return livePlayers.filter((player) => NvhxService.CheckIfUserIsBanned(player.identifiers));
    }

    private async formatBannedPlayersDescription(
        bannedPlayers: ILivePlayer[],
        interaction: ChatInputCommandInteraction,
    ): Promise<string> {
        if (!interaction.guildId) return '';
        let desc = `Es sind aktuell **${bannedPlayers.length}** von NVHX Global gebannte Spieler auf dem Server.\n`;
        if (bannedPlayers.length > 0) {
            desc += '\nAktuell gebannte Spieler:\n';
            const bannedEmote = EmoteManager.getEmote('pbot_banned', interaction.guildId);
            bannedPlayers.forEach((player) => {
                desc += `\n${bannedEmote} **${player.name} | ServerID: ${
                    player.id
                }** \`\`\`${player.identifiers.join('\n')}\`\`\``;
            });
        }
        return desc;
    }
}
