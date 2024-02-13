import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

export class Fraksperre extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_UNLIMITED,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.DEV.BOTTEST,
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
        const steamid = options.getString('steamid');
        if (!steamid) {
            await interaction.reply({ content: 'Bitte gib eine SteamID an!', ephemeral: true });
            return;
        }
        const vPlayer = await PlayerService.validatePlayer(steamid);
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
            const [dbResponse] = await GameDB.query<ResultSetHeader>(
                'UPDATE users SET fraksperre = NOW() WHERE identifier = ?',
                [vPlayer.identifiers.steam],
            );
            if (dbResponse.affectedRows === 0) {
                await interaction.reply({
                    content: 'Die Fraktionssperre konnte nicht entfernt werden!',
                    ephemeral: true,
                });
                return;
            }
            LogManager.debug(dbResponse);
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({
                content: 'Es ist ein Fehler aufgetreten!',
                ephemeral: true,
            });
        }
        LogManager.log(vPlayer);

        this.replyWithEmbed({
            interaction,
            title: 'Fraktionssperre entfernt',
            description: `Die Fraktionssperre von ${vPlayer.playerdata.fullname} (${
                vPlayer.identifiers.steam
            }) wurde entfernt!\nAltes Datum: ${vPlayer.playerdata.job.fraksperre.toLocaleDateString()}`,
        });
    }

    private async setFraksperre(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const days = options.getInteger('zeit') ?? 5;
        const steamid = options.getString('steamid');
        if (!steamid) {
            await interaction.reply({ content: 'Bitte gib eine SteamID an!', ephemeral: true });
            return;
        }
        const vPlayer = await PlayerService.validatePlayer(steamid);
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
            const [dbResponse] = await GameDB.query<ResultSetHeader>(
                'UPDATE users SET fraksperre = ADDDATE(NOW(), INTERVAL ? DAY) WHERE identifier = ?',
                [days, vPlayer.identifiers.steam],
            );
            LogManager.debug(dbResponse);
            if (dbResponse.affectedRows === 0) {
                await interaction.reply({
                    content: 'Die Fraktionssperre konnte nicht gesetzt werden!',
                    ephemeral: true,
                });
                return;
            }
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }

        this.replyWithEmbed({
            interaction,
            title: 'Fraktionssperre gesetzt',
            description: `Die Fraktionssperre von ${vPlayer.playerdata.fullname} (${
                vPlayer.identifiers.steam
            }) wurde gesetzt!\nDauer: ${days} Tage\nEndet am: ${ts.toLocaleDateString()}`,
        });
    }
}
