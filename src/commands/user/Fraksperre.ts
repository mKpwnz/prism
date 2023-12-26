import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import Config from '@proot/Config';
import { GameDB } from '@sql/Database';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { EENV } from '@enums/EENV';
import { Player } from '@controller/Player.controller';

export class Fraksperre extends Command {
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
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('fraksperre')
                .setDescription('Befehle zur Fraksperre')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('entfernen')
                        .setDescription('Entferne die Fraktionssperre eines Spielers')
                        .addStringOption((option) =>
                            option
                                .setName('steamid')
                                .setDescription('SteamID des Spielers')
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('setzen')
                        .setDescription('Setze dem Spieler eine Fraksperre')
                        .addStringOption((option) =>
                            option
                                .setName('steamid')
                                .setDescription('SteamID des Spielers')
                                .setRequired(true),
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('zeit')
                                .setDescription('Setze die Zeit in Tagen (Default: 5 Tage)'),
                        ),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'entfernen') {
            await this.removeFraksperre(interaction);
        } else if (interaction.options.getSubcommand() === 'setzen') {
            await this.setFraksperre(interaction);
        } else {
            await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true });
        }
    }

    private async removeFraksperre(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        const steamid = options.getString('steamid');
        if (!steamid) {
            await interaction.reply({ content: 'Bitte gib eine SteamID an!', ephemeral: true });
            return;
        }
        const vPlayer = await Player.validatePlayer(steamid);
        if (!vPlayer) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            });
            return;
        }
        const today = new Date();
        if (vPlayer.playerdata.job.fraksperre.getTime() < today.getTime()) {
            await interaction.reply({
                content: 'Der Spieler hat keine Fraktionssperre!',
                ephemeral: true,
            });
            return;
        }
        try {
            // TODO: Response verarbeiten und auswerten
            const dbResponse = await GameDB.query(
                'UPDATE users SET fraksperre = NOW() WHERE identifier = ?',
                [vPlayer.identifiers.steam],
            );
            LogManager.debug(dbResponse);
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({
                content: 'Es ist ein Fehler aufgetreten!',
                ephemeral: true,
            });
        }
        LogManager.log(vPlayer);
        embed.setTitle('Fraktionssperre entfernt');
        embed.setDescription(
            `
                Die Fraktionssperre von ${vPlayer.playerdata.fullname} (${
                    vPlayer.identifiers.steam
                }) wurde entfernt!\n
                Altes Datum: ${vPlayer.playerdata.job.fraksperre.toLocaleDateString()}`,
        );
        await interaction.reply({ embeds: [embed] });
    }

    private async setFraksperre(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const days = options.getInteger('zeit') ?? 5;
        const steamid = options.getString('steamid');
        if (!steamid) {
            await interaction.reply({ content: 'Bitte gib eine SteamID an!', ephemeral: true });
            return;
        }
        const vPlayer = await Player.validatePlayer(steamid);
        if (!vPlayer) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            });
            return;
        }
        const ts = new Date();
        ts.setDate(ts.getDate() + days);
        try {
            // TODO: Response verarbeiten und auswerten
            const dbResponse = await GameDB.query(
                'UPDATE users SET fraksperre = ADDDATE(NOW(), INTERVAL ? DAY) WHERE identifier = ?',
                [days, vPlayer.identifiers.steam],
            );
            LogManager.debug(dbResponse);
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
        const embed = this.getEmbedTemplate(interaction);
        embed.setTitle('Fraktionssperre gesetzt');
        embed.setDescription(
            `Die Fraktionssperre von ${vPlayer.playerdata.fullname} (${
                vPlayer.identifiers.steam
            }) wurde gesetzt!\nDauer: ${days} Tage\nEndet am: ${ts.toLocaleDateString()}`,
        );
        await interaction.reply({ embeds: [embed] });
    }
}
