import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { EEmbedColors } from '@prism/typings/enums/EmbedColors';
import { PlayerService } from '@prism/services/PlayerService';
import { GameDB } from '@prism/sql/Database';
import { Helper } from '@prism/utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('changebirthday')
        .setDescription('Ändert den Geburtstag eines Nutzers')
        .setDMPermission(true)
        .addStringOption((option) =>
            option.setName('steam').setDescription('Steam ID des Nutzers').setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('datum')
                .setDescription('Neuer Geburtstag des Spielers (dd.mm.yyyy)')
                .setRequired(true),
        ),
)
export class ChangeBirthday extends Command {
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

            Config.Groups.PROD.BOT_DEV,
        ];
        this.AllowedUsers = [Config.Users.L33V33N, Config.Users.ZMASTER, Config.Users.MANU];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const birthday = options.getString('datum', true);
        const steamID = options.getString('steam', true);

        const vPlayer = await PlayerService.validatePlayer(steamID);
        if (!vPlayer) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            });
            return;
        }

        if (!Helper.validateDate(birthday)) {
            await interaction.reply({
                content: 'Das Format des Geburtstags ist nicht korrekt!',
                ephemeral: true,
            });
            return;
        }

        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE users SET dateofbirth = ? WHERE identifier = ?`,
            [birthday, vPlayer.identifiers.steam],
        );

        if (res.affectedRows > 0) {
            await this.replyWithEmbed({
                title: 'Geburtstag geändert',
                description: `Der Geburtstag des Spielers **${vPlayer.playerdata.fullname}** (${vPlayer.identifiers.steam}) wurde auf **${birthday}** geändert.`,
                color: EEmbedColors.SUCCESS,
            });
        } else {
            await this.replyWithEmbed({
                title: 'Geburtstag nicht geändert',
                description: `Der Geburtstag des Spielers **${vPlayer.playerdata.fullname}** (${vPlayer.identifiers.steam}) konnte nicht auf **${birthday}** geändert werden.`,
                color: EEmbedColors.ALERT,
            });
        }
    }
}
