import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { NvhxData } from '@controller/NvhxData.controller';
import { Player } from '@controller/Player.controller';
import { EENV } from '@enums/EENV';
import { ILivePlayer } from '@interfaces/ILivePlayer';
import Config from '@proot/Config';
import { Helper } from '@utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Nvhx extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED];
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
                            option.setName('banid').setDescription('BanID des Banns').setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand.setName('checkplayerbans').setDescription('Triggert Neverhax Info'),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
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
        try {
            const id = interaction.options.getInteger('id', true);
            await RconClient.sendCommand(`nvhx sc ${id}`);
            await this.replyWithEmbed(
                interaction,
                'Neverhax Screenshot',
                `Triggere Neverhax Screenshot für SpielerID ${id}`,
            );
        } catch (error) {
            await this.handleInteractionError(error, interaction);
        }
    }

    private async unbanPlayerById(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const banId = interaction.options.getString('banid', true);
            const response = await RconClient.sendCommand(`nvhx unban ${banId}`);

            if (response.includes('Unbanned: ')) {
                await this.replyWithEmbed(interaction, 'Neverhax Unban', `Entbanne BanID ${banId}`);
            } else {
                await interaction.reply({
                    content: 'BanID nicht gefunden!',
                    ephemeral: true,
                });
            }
        } catch (error) {
            await this.handleInteractionError(error, interaction);
        }
    }

    private async getBannedLivePlayers(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const bannedPlayers = await this.fetchBannedLivePlayers();
            const description = await this.formatBannedPlayersDescription(bannedPlayers);
            await this.replyWithEmbed(interaction, 'Gebannte Spieler', description);
        } catch (error) {
            await this.handleInteractionError(error, interaction);
        }
    }

    private async fetchBannedLivePlayers(): Promise<ILivePlayer[]> {
        const livePlayers = await Player.getAllLivePlayers();
        const globalBans = await NvhxData.GetAllGlobalBans();

        return livePlayers.filter((player) => NvhxData.CheckIfUserIsBanned(player.identifiers, globalBans));
    }

    private async formatBannedPlayersDescription(bannedPlayers: ILivePlayer[]): Promise<string> {
        let desc = `Es sind aktuell **${bannedPlayers.length}** von NVHX Global gebannte Spieler auf dem Server.\n`;
        if (bannedPlayers.length > 0) {
            desc += '\nAktuell gebannte Spieler:\n';
            const bannedEmote = await Helper.getEmote('pbot_banned');
            bannedPlayers.forEach((player) => {
                desc += `\n${bannedEmote} **${player.name} | ServerID: ${player.id}** \`\`\`${player.identifiers.join(
                    '\n',
                )}\`\`\``;
            });
        }
        return desc;
    }

    private async replyWithEmbed(
        interaction: ChatInputCommandInteraction,
        title: string,
        description: string,
    ): Promise<void> {
        const embed = this.getEmbedTemplate(interaction);
        embed.setTitle(title);
        embed.setDescription(description);
        await interaction.reply({ embeds: [embed] });
    }

    private async handleInteractionError(error: any, interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({
            content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(error)}\`\`\``,
            ephemeral: true,
        });
    }
}
