import Config from '@Config';
import { Command } from '@class/Command';
import { PerformanceProfiler } from '@class/PerformanceProfiler';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ESearchType } from '@enums/ESearchType';
import { NvhxService } from '@services/NvhxService';
import { PlayerService } from '@services/PlayerService';
import { BotDB, GameDB } from '@sql/Database';
import { IFindUser } from '@sql/schema/User.schema';
import { Helper } from '@utils/Helper';
import LogManager from '@utils/Logger';
import {
    AttachmentBuilder,
    ChatInputCommandInteraction,
    GuildEmoji,
    SlashCommandBuilder,
} from 'discord.js';

export class WhoIs extends Command {
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
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('whois')
                .setDescription('Suche nach Spielern')
                // add string option
                .setDMPermission(true)
                .addStringOption((option) =>
                    option
                        .setName('input')
                        .setDescription('Identifier des Spielers')
                        .setRequired(true),
                )
                .addBooleanOption((option) =>
                    option.setName('export').setDescription('Gibt eine JSON Datei aus'),
                )
                .addIntegerOption((option) => option.setName('seite').setDescription('Seitenzahl'))
                .addStringOption((option) =>
                    option
                        .setName('spalte')
                        .setDescription('Sucht in einer speziellen Spalte')
                        .addChoices(
                            { name: 'Identifier', value: ESearchType.IDENTIFIER },
                            { name: 'SteamID', value: ESearchType.STEAMID },
                            { name: 'Lizenz', value: ESearchType.LICENSE },
                            { name: 'LiveID', value: ESearchType.LIVEID },
                            { name: 'XBLID', value: ESearchType.XBLID },
                            { name: 'Discord', value: ESearchType.DISCORD },
                            { name: 'PlayerIP', value: ESearchType.PLAYERIP },
                            { name: 'Name', value: ESearchType.NAME },
                            { name: 'Playername', value: ESearchType.PLAYERNAME },
                            { name: 'Vorname', value: ESearchType.FIRSTNAME },
                            { name: 'Nachname', value: ESearchType.LASTNAME },
                            { name: 'Job', value: ESearchType.JOB },
                            { name: 'Gruppe', value: ESearchType.GROUP },
                            { name: 'Telefonnummer', value: ESearchType.PHONENUMBER },
                        ),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const profiler = new PerformanceProfiler('WhoIs Command');

        const { channel } = interaction;
        const identifierValue = interaction.options.getString('input');

        if (!identifierValue) {
            await interaction.reply({
                content: 'Die Option "identifier" enthält keinen gültigen Wert.',
                ephemeral: true,
            });
            return;
        }
        profiler.addStep('Validate Input');
        const pageSize = 18;

        const page = interaction.options.getNumber('seite') ?? 1;
        const spalte = interaction.options.getString('spalte') ?? ESearchType.ALL;
        const filter = spalte ? `\nFilter: ${spalte}` : '';

        const findUsers: IFindUser[] = await WhoIs.searchUsers(identifierValue, spalte);
        profiler.addStep('Search Users');
        const embedFields = [];
        const bannedEmote = await Helper.getEmote('pbot_banned');
        profiler.addStep('Get Banned Emote');
        if (findUsers.length === 0) {
            await interaction.reply({
                content: `Keine Daten für "${identifierValue}" gefunden!${filter}`,
                ephemeral: true,
            });
            return;
        }

        await interaction.deferReply();

        profiler.addStep('Get Global Bans');
        for (let i = pageSize * (page - 1); i < findUsers.length; i++) {
            // Pagination
            if (embedFields.length >= pageSize) {
                break;
            }

            const steamId: bigint = this.getSteamIdOrDefaultByUser(findUsers[i]);
            const fraksperreString = this.getFraksperreByUser(findUsers[i]);
            const levelString = this.getLevelByUser(findUsers[i]);

            const teamNoteCount = await BotDB.team_notes.count({
                where: {
                    user: findUsers[i].identifier,
                },
            });

            const nvhxBanned = await NvhxService.CheckIfUserIsBanned([
                findUsers[i].identifier,
                findUsers[i].discord,
            ]);
            profiler.addStep(`Check Bann ${i}`);

            const onlineID = await PlayerService.getPlayerId(findUsers[i].identifier);

            embedFields.push(
                await this.EmbedFieldsBuilder(
                    findUsers[i],
                    onlineID,
                    nvhxBanned,
                    bannedEmote,
                    steamId,
                    fraksperreString,
                    levelString,
                    teamNoteCount,
                    pageSize,
                    embedFields.length,
                ),
            );
        }

        const file = interaction.options.getBoolean('export');

        if (file === true) {
            // create JSON File and send it to client
            const jsonString = JSON.stringify(findUsers, null, 4);
            const buffer = Buffer.from(jsonString, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, {
                name: `${identifierValue}.json`,
            });
            channel?.send({
                content: `${interaction.user.toString()}`,
                files: [attachment],
            });
            await interaction.editReply({
                content: 'Daten gefunden und im Chat hinterlegt!',
            });
        } else {
            let pageString = '';
            if (findUsers.length > pageSize) {
                pageString = `\nSeite ${page}/${Math.ceil(findUsers.length / pageSize)}`;
            }
            let additionalString = '';
            if (embedFields.length === pageSize || page > 1) {
                additionalString = `\n${
                    findUsers.length - embedFields.length
                } weitere Ergebnisse sind ausgeblendet!`;
            }

            await this.replyWithEmbed({
                title: `Suchergebnisse`,
                description: `Hier sind ${embedFields.length}/${findUsers.length} Suchergebnisse für "${identifierValue}":${additionalString}${pageString}`,
                fields: embedFields,
            });
        }
        await profiler.sendEmbed(interaction);
    }

    private async EmbedFieldsBuilder(
        user: IFindUser,
        id: number,
        nvhxBanned: boolean,
        bannedEmote: GuildEmoji | null,
        steamId: bigint,
        fraksperreString: string,
        levelString: string,
        teamNoteCount: number,
        pageSize: number,
        embedFieldLength: number,
    ) {
        return {
            name: `${user.playername} (${user.name})`,
            value:
                `${
                    nvhxBanned ? `${bannedEmote} **NVHX Global Ban Detected** ${bannedEmote}\n` : ''
                }` +
                `${id > -1 ? `:green_circle: **Online mit ID: ${id} **` : ''}\n` +
                `SteamID: [${
                    user.identifier
                }](https://steamid.pro/de/lookup/${steamId})\nDiscord: ${
                    user.discord ? `<@${user.discord?.replace('discord:', '')}>` : 'Nicht Vorhanden'
                }\nJob: ${user.job} (${user.job_grade})\nGroup: ${user.group}\nIC Name: ${
                    user.firstname
                } ${user.lastname}\nBank: ${user.bank.toLocaleString(
                    'de-DE',
                )}€\nHand: ${user.money.toLocaleString(
                    'de-DE',
                )}€\nSchwarzgeld: ${user.black_money.toLocaleString('de-DE')}€\nNummer: ${
                    user.phone_number
                }${fraksperreString}${levelString}${
                    teamNoteCount > 0 ? '\n**Es ist eine Teamnote vorhanden**' : ''
                }` +
                `\n${embedFieldLength < pageSize - 1 ? '-----' : ''}`,
            inline: false,
        };
    }

    private getLevelByUser(user: IFindUser) {
        let levelString = '';
        if (user.crafting_level) {
            levelString = `\nCrafting Level: ${
                (user.crafting_level - (user.crafting_level % 100)) / 100
            }`;
        }
        return levelString;
    }

    private getFraksperreByUser(user: IFindUser) {
        let fraksperrestring = '';
        if (user.fraksperre) {
            const now = Math.floor(Date.now() / 1000);
            const expiration = new Date(user.fraksperre).getTime() / 1000;
            const diff = expiration - now;
            if (diff > 0) {
                fraksperrestring = `${fraksperrestring}\nFraksperre Verbleibend: ${Helper.secondsToTimeString(
                    diff,
                )}`;
            }
        }
        return fraksperrestring;
    }

    private getSteamIdOrDefaultByUser(user: IFindUser) {
        if (user.identifier) {
            const hexString = `0x${user.identifier.replace('steam:', '')}`;
            if (/^0x[0-9A-Fa-f]+$/g.test(hexString)) {
                return BigInt(hexString);
            }
            return BigInt(0); // Fallback-Wert, wenn die Zeichenfolge ungültig ist
        }
        return BigInt(0); // Fallback-Wert, wenn identifier nicht vorhanden ist
    }

    private static async searchUsers(searchText: string, column: string): Promise<IFindUser[]> {
        const columns = new Map<string, string>([
            [ESearchType.IDENTIFIER, `LOWER( users.identifier ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.STEAMID, `LOWER( users.steamid ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.LICENSE, `LOWER( baninfo.\`license\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.LIVEID, `LOWER( baninfo.\`liveid\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.XBLID, `LOWER( baninfo.\`xblid\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.DISCORD, `LOWER( baninfo.\`discord\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.PLAYERIP, `LOWER( baninfo.\`playerip\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.NAME, `LOWER( users.\`name\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.PLAYERNAME, `LOWER( baninfo.playername) LIKE LOWER("%${searchText}%")`],
            [ESearchType.FIRSTNAME, `LOWER( users.\`firstname\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.LASTNAME, `LOWER( users.\`lastname\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.JOB, `LOWER( users.\`job\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.GROUP, `LOWER( users.\`group\` ) LIKE LOWER( "%${searchText}%" )`],
            [ESearchType.PHONENUMBER, `phone_phones.phone_number LIKE "%${searchText}%"`],
            [
                ESearchType.ALL,
                `LOWER( users.\`identifier\` ) LIKE (SELECT owned_vehicles.\`owner\` FROM owned_vehicles WHERE LOWER(owned_vehicles.\`plate\`) LIKE LOWER("%${searchText}%") LIMIT 1) OR ` +
                    `LOWER( users.\`steamId\` ) LIKE (SELECT owned_vehicles.\`owner\` FROM owned_vehicles WHERE LOWER(owned_vehicles.\`plate\`) LIKE LOWER("%${searchText}%") LIMIT 1) OR ` +
                    `LOWER( baninfo.\`license\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( baninfo.\`liveid\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( baninfo.\`xblid\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( baninfo.\`discord\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( baninfo.\`playerip\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( users.\`name\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( baninfo.playername) LIKE LOWER("%${searchText}%") OR ` +
                    `LOWER( users.identifier ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( users.steamId ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( users.\`firstname\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( users.\`lastname\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( users.\`job\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( users.\`group\` ) LIKE LOWER( "%${searchText}%" ) OR ` +
                    `LOWER( CONCAT(users.firstname, ' ', users.lastname) ) LIKE LOWER ( "%${searchText}%" ) OR ` +
                    `phone_phones.phone_number LIKE "%${searchText}%"`,
            ],
        ]);

        const query =
            `SELECT ` +
            `baninfo.playername, ` +
            `baninfo.discord, ` +
            `users.\`name\`, ` +
            `users.identifier, ` +
            `CONCAT(users.firstname, ' ', users.lastname) as fullname, ` +
            `users.firstname, ` +
            `users.lastname, ` +
            `users.\`group\`, ` +
            `users.job, ` +
            `users.job_grade, ` +
            `phone_phones.phone_number, ` +
            `cast( json_extract( \`users\`.\`accounts\`, '$.bank' ) AS signed ) AS bank, ` +
            `cast( json_extract( \`users\`.\`accounts\`, '$.money' ) AS signed ) AS money, ` +
            `cast( json_extract( \`users\`.\`accounts\`, '$.black_money' ) AS signed ) AS black_money, ` +
            `users.fraksperre, ` +
            `users.crafting_level ` +
            `FROM users ` +
            `LEFT JOIN baninfo ON users.identifier = baninfo.identifier ` +
            `JOIN phone_phones ON users.identifier = phone_phones.id ` +
            `WHERE ${columns.get(column)}`;
        try {
            const [rows] = await GameDB.execute(query); // Verwenden Sie await und die execute-Funktion
            return rows as IFindUser[]; // Casten Sie das Ergebnis in das gewünschte Format
        } catch (error) {
            LogManager.error(error);
            return [];
        }
    }
}
