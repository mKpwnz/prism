import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { Player } from '@controller/Player.controller';
import { ValidatedPlayer } from '@ctypes/ValidatedPlayer';
import { ELicenses } from '@enums/ELicenses';
import Config from '@proot/Config';
import { GameDB } from '@sql/Database';
import { IUser } from '@sql/schema/User.schema';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Lizenz } from './Lizenz';

export class Deletecharacter extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.DEVELOPMENT;
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
        ];
        this.IsBetaCommand = true;
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('deletecharacter')
                .setDescription('Löscht einen Charakter von einem Spieler')
                .addStringOption((option) =>
                    option.setName('steamid').setDescription('SteamID des zu löschenden Spielers').setRequired(true),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await this.delete(interaction);
    }

    public async delete(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        try {
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
            const phone = await this.deletePhone(vPlayer.identifiers.steam);
            if (!phone) {
                await interaction.reply({
                    content: 'Es ist ein Fehler beim Löschen des Telefons aufgetreten!',
                    ephemeral: true,
                });
                return;
            }
            const licenses = await Lizenz.deleteLicense(vPlayer, ELicenses.ALL);
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
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true });
        }
    }

    public async deletePhone(itendifier: string): Promise<boolean> {
        try {
            // TODO: ADD Return Handling
            await GameDB.query('DELETE FROM phone_phones WHERE identifier = ?', [itendifier]);
            return true;
        } catch (error) {
            LogManager.error(error);
            return false;
        }
    }

    private async moveCharacterToArchive(vPlayer: ValidatedPlayer): Promise<boolean> {
        try {
            const newIdentifier = vPlayer.identifiers.steam.replace('steam', 'deleted');
            // TODO: Add Return Handler
            await GameDB.query('UPDATE users SET identifier = ? WHERE identifier = ?', [
                newIdentifier,
                vPlayer.identifiers.steam,
            ]);
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
            LogManager.error(error);
            return false;
        }
    }
}
