import { Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { ELicenses } from '@prism/typings/enums/ELicenses';
import { IValidatedPlayer } from '@prism/typings/interfaces/IValidatedPlayer';
import LogManager from '@prism/manager/LogManager';
import { PhoneService } from '@prism/services/PhoneService';
import { PlayerService } from '@prism/services/PlayerService';
import { GameDB } from '@prism/sql/Database';
import { IUser } from '@prism/sql/gameSchema/User.schema';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';
import { License } from './License';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('deletecharacter')
        .setDescription('Löscht einen Charakter von einem Spieler')
        .addStringOption((option) =>
            option
                .setName('steamid')
                .setDescription('SteamID des zu löschenden Spielers')
                .setRequired(true),
        ),
)
export class DeleteCharacter extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.DEVELOPMENT;
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
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const steamId = interaction.options.getString('steamid', true);

        const vPlayer = await PlayerService.validatePlayer(steamId);
        if (!vPlayer) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            });
            return;
        }

        const phone = await PhoneService.deletePhoneByIdentifier(vPlayer.identifiers.steam);
        if (!phone) {
            await interaction.reply({
                content: 'Es ist ein Fehler beim Löschen des Telefons aufgetreten!',
                ephemeral: true,
            });
            return;
        }

        const licenses = await License.deleteLicense(vPlayer, ELicenses.ALL);
        if (licenses instanceof Error) {
            LogManager.error(licenses);
            await interaction.reply({
                content: `Es ist ein Fehler beim Löschen der Lizenzen aufgetreten!\`\`\`json${JSON.stringify(
                    licenses,
                )}\`\`\``,
                ephemeral: true,
            });
            return;
        }
        const archive = await this.moveCharacterToArchive(vPlayer);
        if (!archive) {
            await interaction.reply({
                content: 'Es ist ein Fehler beim Archivieren des Charakters aufgetreten!',
                ephemeral: true,
            });
        }
    }

    private async moveCharacterToArchive(vPlayer: IValidatedPlayer): Promise<boolean> {
        try {
            const newIdentifier = vPlayer.identifiers.steam.replace('steam', 'deleted');
            const [updateResponse] = await GameDB.query<ResultSetHeader>(
                'UPDATE users SET identifier = ? WHERE identifier = ?',
                [newIdentifier, vPlayer.identifiers.steam],
            );
            if (updateResponse.affectedRows === 0) {
                return false;
            }
            // Move to Archive
            const [response] = await GameDB.query<IUser[]>(
                'INSERT INTO users_deleted SELECT * FROM users WHERE identifier = ? RETURNING *',
                [vPlayer.identifiers.steam],
            );
            /* Löschen des Charakters
            await Database.query('DELETE FROM users WHERE identifier = ?', [user.identifier])
            */
            if (response.length > 0) {
                return true;
            }
            return false;
        } catch (error) {
            Sentry.captureException(error);
            LogManager.error(error);
            return false;
        }
    }
}
