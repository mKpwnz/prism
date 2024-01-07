import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

export class Rename extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_RENAME,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,

            Config.Groups.DEV.BOTTEST,
        ];
        this.AllowedUsers = [Config.Users.L33V33N, Config.Users.ZMASTER, Config.Users.MANU];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('rename')
                .setDescription('Suche nach Spielern')
                .addStringOption((option) =>
                    option
                        .setName('steam')
                        .setDescription('Steam ID des Nutzers')
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('vorname').setDescription('Vorname des Spielers'),
                )
                .addStringOption((option) =>
                    option.setName('nachname').setDescription('Nachname des Spielers'),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamId = interaction.options.getString('steam', true);
        let firstname = interaction.options.getString('vorname');
        let lastname = interaction.options.getString('nachname');
        const vPlayer = await PlayerService.validatePlayer(steamId);

        if (!vPlayer) {
            await this.replyWithEmbed({
                interaction,
                title: 'Fehler',
                description: 'Der Spieler konnte nicht gefunden werden!',
                color: EEmbedColors.ALERT,
            });
            return;
        }

        if (!firstname && !lastname) {
            await this.replyWithEmbed({
                interaction,
                title: 'Fehler',
                description: 'Bitte mindestens einen Vornamen oder Nachnamen angeben!',
                color: EEmbedColors.ALERT,
            });
            return;
        }

        if (!firstname) {
            firstname = vPlayer.playerdata.firstname;
        }

        if (!lastname) {
            lastname = vPlayer.playerdata.lastname;
        }

        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE users SET firstname = ?, lastname = ? WHERE identifier = ?`,
            [firstname, lastname, vPlayer.identifiers.steam],
        );

        if (res.affectedRows !== 0) {
            await this.replyWithEmbed({
                interaction,
                title: 'Spieler umbenannt',
                description: `Der Spieler wurde erfolgreich umbenannt.`,
                fields: [
                    {
                        name: 'SteamID',
                        value: vPlayer.identifiers.steam,
                    },
                    {
                        name: 'Vorheriger Name',
                        value: vPlayer.playerdata.fullname,
                    },
                    {
                        name: 'Neuer Name',
                        value: `${firstname} ${lastname}`,
                    },
                ],
                color: EEmbedColors.SUCCESS,
            });
        } else {
            await this.replyWithEmbed({
                interaction,
                title: 'Fehler',
                description: 'Der Spieler konnte nicht umbenannt werden!',
                color: EEmbedColors.ALERT,
            });
        }
    }
}
