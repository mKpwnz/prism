import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { PlayerService } from '@prism/services/PlayerService';
import { GameDB } from '@prism/sql/Database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

@RegisterCommand(
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
)
export class Fraksperre extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.BOT_DEV,
        ];
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
        const steamid = interaction.options.getString('steamid', true);
        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }
        const today = new Date();
        if (vPlayer.playerdata.job.fraksperre.getTime() < today.getTime()) {
            await this.replyError('Der Spieler hat keine Fraktionssperre!');
            return;
        }

        const [res] = await GameDB.execute<ResultSetHeader>(
            'UPDATE users SET fraksperre = NOW() WHERE identifier = ?',
            [vPlayer.identifiers.steam],
        );
        if (res.affectedRows === 0) {
            await this.replyError('Es ist ein Fehler aufgetreten!');
            return;
        }

        await this.replyWithEmbed({
            title: 'Fraktionssperre entfernt',
            description: `Die Fraktionssperre von ${vPlayer.playerdata.fullname} (${
                vPlayer.identifiers.steam
            }) wurde entfernt!\nAltes Datum: ${vPlayer.playerdata.job.fraksperre.toLocaleDateString()}`,
        });
    }

    private async setFraksperre(interaction: ChatInputCommandInteraction): Promise<void> {
        const days = interaction.options.getInteger('zeit') ?? 5;
        const steamid = interaction.options.getString('steamid', true);

        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }
        const ts = new Date();
        ts.setDate(ts.getDate() + days);

        const [res] = await GameDB.execute<ResultSetHeader>(
            'UPDATE users SET fraksperre = ADDDATE(NOW(), INTERVAL ? DAY) WHERE identifier = ?',
            [days, vPlayer.identifiers.steam],
        );
        if (res.affectedRows === 0) {
            await this.replyError('Es ist ein Fehler aufgetreten!');
            return;
        }

        await this.replyWithEmbed({
            title: 'Fraktionssperre gesetzt',
            description: `Die Fraktionssperre von ${vPlayer.playerdata.fullname} (${
                vPlayer.identifiers.steam
            }) wurde gesetzt!\nDauer: ${days} Tage\nEndet am: ${ts.toLocaleDateString()}`,
        });
    }
}
