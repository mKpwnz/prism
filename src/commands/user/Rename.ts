import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { EEmbedColors } from '@enums/EmbedColors';
import { PlayerService } from '@services/PlayerService';
import { GameDB } from '@sql/Database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';
import { sendToChannel } from '@utils/helpers/EmbedHelper';

export class Rename extends Command {
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

            Config.Groups.PROD.BOT_DEV,
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
            await this.replyError('Der Spieler konnte nicht gefunden werden!');
            return;
        }

        if (!firstname && !lastname) {
            await this.replyError('Bitte mindestens einen Vornamen oder Nachnamen angeben!');
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
            const embed = this.getEmbedTemplate({
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

            await sendToChannel(embed, Config.Channels.PROD.S1_NAMECHANGE);
            await interaction.reply({ embeds: [embed] });
        } else {
            await this.replyError('Der Spieler konnte nicht umbenannt werden!');
        }
    }
}
