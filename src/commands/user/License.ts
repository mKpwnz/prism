import { Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { ELicenses } from '@prism/enums/ELicenses';
import { IValidatedPlayer } from '@prism/interfaces/IValidatedPlayer';
import LogManager from '@prism/manager/LogManager';
import { PlayerService } from '@prism/services/PlayerService';
import { GameDB } from '@prism/sql/Database';
import { IUserLicense } from '@prism/sql/gameSchema/UserLicense.schema';
import { NonEmptyArray } from '@prism/types/NonEmptyArray';
import { Helper } from '@prism/utils/Helper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ResultSetHeader } from 'mysql2';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('lizenz')
        .setDescription('Befehle zu den IC Lizenzen')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('entfernen')
                .setDescription('Entferne die Lizenz eines Spielers')
                .addStringOption((option) =>
                    option
                        .setName('steamid')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('lizenz')
                        .setDescription('Lizenz auswählen')
                        .setRequired(true)
                        .setChoices(
                            { name: 'Alle', value: ELicenses.ALL },
                            { name: 'Flugschein', value: ELicenses.AIRCRAFT },
                            { name: 'Bootsschein', value: ELicenses.BOATING },
                            { name: 'Diplomatenausweis', value: ELicenses.DIPLO },
                            { name: 'Verkehrssicherheit', value: ELicenses.DMV },
                            { name: 'Führerschein Klasse A', value: ELicenses.DRIVE_BIKE },
                            { name: 'Führerschein Klasse B', value: ELicenses.DRIVE },
                            { name: 'Führerschein Klasse C', value: ELicenses.DRIVE_TRUCK },
                            { name: 'Führerschein Klasse D', value: ELicenses.DRIVE_BUS },
                            { name: 'Dienstausweis', value: ELicenses.JOBLIC },
                            { name: 'Waffenschein', value: ELicenses.WEAPON },
                        ),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('hinzufügen')
                .setDescription('Füge dem Spieler eine Lizenz hinzu')
                .addStringOption((option) =>
                    option
                        .setName('steamid')
                        .setDescription('SteamID des Spielers')
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('lizenz')
                        .setDescription('Lizenz auswählen')
                        .setRequired(true)
                        .setChoices(
                            { name: 'Flugschein', value: ELicenses.AIRCRAFT },
                            { name: 'Bootsschein', value: ELicenses.BOATING },
                            { name: 'Diplomatenausweis', value: ELicenses.DIPLO },
                            { name: 'Verkehrssicherheit', value: ELicenses.DMV },
                            { name: 'Führerschein Klasse A', value: ELicenses.DRIVE_BIKE },
                            { name: 'Führerschein Klasse B', value: ELicenses.DRIVE },
                            { name: 'Führerschein Klasse C', value: ELicenses.DRIVE_TRUCK },
                            { name: 'Führerschein Klasse D', value: ELicenses.DRIVE_BUS },
                            { name: 'Dienstausweis', value: ELicenses.JOBLIC },
                            { name: 'Waffenschein', value: ELicenses.WEAPON },
                        ),
                ),
        ),
)
export class License extends Command {
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

            Config.Groups.PROD.BOT_DEV,
        ];
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'entfernen') {
            await this.removeLicense(interaction);
        } else if (interaction.options.getSubcommand() === 'hinzufügen') {
            await this.addLicense(interaction);
        } else {
            await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true });
        }
    }

    private async removeLicense(interaction: ChatInputCommandInteraction): Promise<void> {
        const lizenzStr = interaction.options.getString('lizenz', true);
        const steamid = interaction.options.getString('steamid', true);

        let license: ELicenses;
        try {
            license = Helper.enumFromValue(lizenzStr, ELicenses);
        } catch (error) {
            Sentry.captureException(error);
            LogManager.error(error);
            await this.replyError('Bitte gib eine gültige Lizenz an!');
            return;
        }

        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }

        const response = await License.deleteLicense(vPlayer, license);
        if (response instanceof Error) {
            LogManager.error(response);
            await this.replyError(
                `Es ist ein Fehler beim Löschen der Lizenzen aufgetreten!\`\`\`json${JSON.stringify(
                    response,
                )}\`\`\``,
            );
            return;
        }
        await this.replyWithEmbed({
            title: 'Lizenz entfernt',
            description: `Es wurde/n ${response.affectedRows} Lizenz/en von ${vPlayer.playerdata.fullname} (\`${vPlayer.identifiers.steam}\`) entfernt!`,
        });
    }

    private async addLicense(interaction: ChatInputCommandInteraction): Promise<void> {
        const license = interaction.options.getString('lizenz', true);
        const steamid = interaction.options.getString('steamid', true);

        const vPlayer = await PlayerService.validatePlayer(steamid);
        if (!vPlayer) {
            await this.replyError('Es konnte kein Spieler mit dieser SteamID gefunden werden!');
            return;
        }

        let query = 'SELECT * FROM user_licenses WHERE owner = ?';
        if (license !== 'all') {
            query += ` AND type = "${license}"`;
        }
        const [lizenzen] = await GameDB.query<IUserLicense[]>(query, [vPlayer.identifiers.steam]);
        if (lizenzen.length !== 0) {
            await this.replyError('Der Spieler besitzt diese Lizenz bereits!');
            return;
        }
        const [lizenz] = await GameDB.query<IUserLicense[]>(
            'INSERT INTO user_licenses(type, owner) VALUES (?, ?)',
            [license, vPlayer.identifiers.steam],
        );
        if (lizenz.length === 0) {
            await this.replyError('Es ist ein Fehler beim Hinzufügen der Lizenz aufgetreten!');
            return;
        }
        await this.replyWithEmbed({
            title: 'Lizenz hinzugefügt',
            description: `Die Lizenz ${license} wurde ${vPlayer.playerdata.fullname} (${vPlayer.identifiers.steam}) hinzugefügt!`,
        });
    }

    public static async deleteLicense(
        vPlayer: IValidatedPlayer,
        licenses: ELicenses | NonEmptyArray<Exclude<ELicenses, ELicenses.ALL>>,
    ): Promise<ResultSetHeader | Error> {
        let query = 'DELETE FROM user_licenses WHERE owner = ? AND ';

        if (Array.isArray(licenses)) {
            for (const license of licenses) {
                if (await License.checkLicense(vPlayer, license)) {
                    if (license === licenses[0]) {
                        query += '(';
                    } else {
                        query += ' OR ';
                    }
                    query += `type = "${license}"`;
                }
            }
            query += ')';
        } else {
            LogManager.debug(licenses);
            if (licenses === ELicenses.ALL) {
                query = 'DELETE FROM user_licenses WHERE owner = ?';
            } else {
                if (!(await License.checkLicense(vPlayer, licenses))) {
                    return new Error('Der Spieler besitzt diese Lizenz nicht!');
                }
                query += `type = "${licenses}"`;
            }
        }
        const result = await GameDB.query<ResultSetHeader>(query, [vPlayer.identifiers.steam]);
        return result[0];
    }

    public static async checkLicense(
        vPlayer: IValidatedPlayer,
        license: Exclude<ELicenses, ELicenses.ALL>,
    ): Promise<boolean> {
        const [result] = await GameDB.query<IUserLicense[]>(
            'SELECT * FROM user_licenses WHERE owner = ? AND type = ?',
            [vPlayer.identifiers.steam, license],
        );
        if (result.length === 0) {
            return false;
        }
        return true;
    }
}
