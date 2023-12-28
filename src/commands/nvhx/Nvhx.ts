import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { NvhxService } from '@services/NvhxService';
import { EENV } from '@enums/EENV';
import { ILivePlayer } from '@interfaces/ILivePlayer';
import { Helper } from '@utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { PlayerService } from '@services/PlayerService';
import Config from '@Config';

export class Nvhx extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_UNLIMITED,
        ];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
        ];
        this.IsBetaCommand = true;
        RegisterCommand(
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
            interaction,
            title: 'Neverhax Screenshot',
            description: `Triggere Neverhax Screenshot für SpielerID ${id}`,
        });
    }

    private async unbanPlayerById(interaction: ChatInputCommandInteraction): Promise<void> {
        const banId = interaction.options.getString('banid', true);
        const response = await RconClient.sendCommand(`nvhx unban ${banId}`);

        if (response.includes('Unbanned: ')) {
            await this.replyWithEmbed({
                interaction,
                title: 'Neverhax Unban',
                description: `Entbanne BanID ${banId}`,
            });
        } else {
            await this.replyWithEmbed({
                interaction,
                title: 'Neverhax Unban',
                description: `BanID nicht gefunden!`,
                ephemeral: true,
            });
        }
    }

    private async getBannedLivePlayers(interaction: ChatInputCommandInteraction): Promise<void> {
        const bannedPlayers = await this.fetchBannedLivePlayers();
        const description = await this.formatBannedPlayersDescription(bannedPlayers);
        await this.replyWithEmbed({
            interaction,
            title: 'Neverhax Info',
            description,
        });
    }

    private async fetchBannedLivePlayers(): Promise<ILivePlayer[]> {
        const livePlayers = await PlayerService.getAllLivePlayers();
        const globalBans = await NvhxService.GetAllGlobalBans();

        return livePlayers.filter((player) =>
            NvhxService.CheckIfUserIsBanned(player.identifiers, globalBans),
        );
    }

    private async formatBannedPlayersDescription(bannedPlayers: ILivePlayer[]): Promise<string> {
        let desc = `Es sind aktuell **${bannedPlayers.length}** von NVHX Global gebannte Spieler auf dem Server.\n`;
        if (bannedPlayers.length > 0) {
            desc += '\nAktuell gebannte Spieler:\n';
            const bannedEmote = await Helper.getEmote('pbot_banned');
            bannedPlayers.forEach((player) => {
                desc += `\n${bannedEmote} **${player.name} | ServerID: ${
                    player.id
                }** \`\`\`${player.identifiers.join('\n')}\`\`\``;
            });
        }
        return desc;
    }
}
