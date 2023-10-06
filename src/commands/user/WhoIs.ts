import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { IFindUser } from '@sql/schema/FindUser.schema'
import { Helper } from '@utils/Helper'
import { APIEmbed, AttachmentBuilder, CommandInteraction, SlashCommandBuilder } from 'discord.js'
import LogManager from '@utils/Logger'
import { ESearchType } from '@enums/ESearchType'

export class WhoIs extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_BOTTESTER]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('whois')
                .setDescription('Suche nach Spielern')
                //add string option
                .setDMPermission(true)
                .addStringOption((option) =>
                    option.setName('input').setDescription('Identifier des Spielers').setRequired(true),
                )
                .addBooleanOption((option) => option.setName('export').setDescription('Gibt eine JSON Datei aus'))
                .addIntegerOption((option) => option.setName('page').setDescription('Seitenzahl'))
                .addStringOption((option) =>
                    option
                        .setName('spalte')
                        .setDescription('Sucht in einer speziellen Spalte')
                        .addChoices(
                            { name: 'Identifier', value: ESearchType.IDENTIFIER.toString() },
                            { name: 'SteamID', value: ESearchType.STEAMID.toString() },
                            { name: 'Lizenz', value: ESearchType.LICENSE.toString() },
                            { name: 'LiveID', value: ESearchType.LIVEID.toString() },
                            { name: 'XBLID', value: ESearchType.XBLID.toString() },
                            { name: 'Discord', value: ESearchType.DISCORD.toString() },
                            { name: 'PlayerIP', value: ESearchType.PLAYERIP.toString() },
                            { name: 'Name', value: ESearchType.NAME.toString() },
                            { name: 'Playername', value: ESearchType.PLAYERNAME.toString() },
                            { name: 'Vorname', value: ESearchType.FIRSTNAME.toString() },
                            { name: 'Nachname', value: ESearchType.LASTNAME.toString() },
                            { name: 'Job', value: ESearchType.JOB.toString() },
                            { name: 'Gruppe', value: ESearchType.GROUP.toString() },
                            { name: 'Telefonnummer', value: ESearchType.PHONENUMBER.toString() },
                        ),
                ) as SlashCommandBuilder,
            this,
        )
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction
        const identifierValue = interaction.options.get('input')?.value?.toString()
        let page = interaction.options.get('page')?.value as number
        let spalte = interaction.options.get('spalte')?.value?.toString()
        let filter = '\nFilter: '
        if (this.CommandEmbed === null) this.CommandEmbed = this.updateEmbed(interaction)
        let embed = this.CommandEmbed
        if (identifierValue) {
            if (spalte === undefined || spalte === null) {
                spalte = 'all'
                filter = ''
            } else {
                filter = filter + spalte
            }
            const finduser: IFindUser[] = await WhoIs.searchUsers(
                identifierValue,
                ESearchType[spalte as keyof typeof ESearchType],
            )
            if (finduser === null) {
                await interaction.reply({ content: 'User nicht gefunden', ephemeral: true })
            } else {
                if (page == undefined || page == null) {
                    page = 1
                }
                let fields = []
                if (finduser.length > 0) {
                    for (let i = 20 * (page - 1); i < finduser.length; i++) {
                        let identifier = finduser[i].identifier ? finduser[i].identifier : 'Unbekannt'

                        let steamId
                        if (finduser[i].identifier) {
                            const hexString = '0x' + identifier
                            if (/^0x[0-9A-Fa-f]+$/g.test(hexString)) {
                                steamId = BigInt(hexString)
                            } else {
                                steamId = BigInt(0) // Fallback-Wert, wenn die Zeichenfolge ungültig ist
                            }
                        } else {
                            steamId = BigInt(0) // Fallback-Wert, wenn identifier nicht vorhanden ist
                        }

                        if (fields.length >= 20) {
                            break
                        } else {
                            let fraksperrestring = ''
                            if (finduser[i].fraksperre) {
                                let now = Math.floor(Date.now() / 1000)
                                let expiration = new Date(finduser[i].fraksperre).getTime() / 1000
                                let diff = expiration - now
                                if (diff > 0) {
                                    fraksperrestring =
                                        fraksperrestring +
                                        '\nFraksperre Verbleibend: ' +
                                        Helper.secondsToTimeString(diff)
                                }
                            }
                            let levelString = ''
                            if (finduser[i].crafting_level) {
                                levelString =
                                    '\nCrafting Level: ' +
                                    (finduser[i].crafting_level - (finduser[i].crafting_level % 100)) / 100
                            }
                            fields.push({
                                name: finduser[i].playername + ' (' + finduser[i].name + ')',
                                value:
                                    'SteamID: [' +
                                    finduser[i].identifier +
                                    '](https://steamid.pro/de/lookup/' +
                                    steamId +
                                    ')\nDiscord: ' +
                                    (finduser[i].discord
                                        ? '<@' + finduser[i].discord?.replace('discord:', '') + '>'
                                        : 'Nicht Vorhanden') +
                                    '\nJob: ' +
                                    finduser[i].job +
                                    ' (' +
                                    finduser[i].job_grade +
                                    ')\nGroup: ' +
                                    finduser[i].group +
                                    '\nIC Name: ' +
                                    finduser[i].firstname +
                                    ' ' +
                                    finduser[i].lastname +
                                    '\nBank: ' +
                                    finduser[i].bank +
                                    '€\nHand: ' +
                                    finduser[i].money +
                                    '€\nSchwarzgeld: ' +
                                    finduser[i].black_money +
                                    '€\nNummer: ' +
                                    finduser[i].phone_number +
                                    '' +
                                    fraksperrestring +
                                    levelString,
                                inline: false,
                            })
                        }
                    }
                }

                if (fields.length === 0) {
                    await interaction.reply({
                        content: `Keine Daten für "${identifierValue}"gefunden!` + filter,
                        ephemeral: true,
                    })
                } else {
                    const file = interaction.options.get('export')?.value
                    if (file === true) {
                        //create JSON File and send it to client
                        const jsonString = JSON.stringify(finduser, null, 4)
                        const buffer = Buffer.from(jsonString, 'utf-8')
                        const attachment = new AttachmentBuilder(buffer, {
                            name: identifierValue + '.json',
                        })
                        channel?.send({
                            content: `${interaction.user.toString()}`,
                            files: [attachment],
                        })
                        await interaction.reply({
                            content: 'Daten gefunden und im Chat hinterlegt!',
                            ephemeral: true,
                        })
                    } else {
                        let pageString = ''
                        if (finduser.length > 20) {
                            pageString = '\nSeite ' + page + '/' + Math.ceil(finduser.length / 20)
                        }
                        let additionalString = ''
                        if (fields.length == 20 || page > 1) {
                            additionalString = `\n${
                                finduser.length - fields.length
                            } weitere Ergebnisse sind ausgeblendet!`
                        }
                        embed.setTitle('Suchergebnisse')
                        embed.setDescription(
                            `Hier sind ${fields.length}/${finduser.length} Suchergebnisse für "${identifierValue}":${additionalString}` +
                                pageString,
                        )
                        embed.setFields(fields)
                        channel?.send({
                            content: `${interaction.user.toString()}`,
                            embeds: [embed],
                        })
                        await interaction.reply({
                            content: 'Daten gefunden und im Chat hinterlegt!',
                            ephemeral: true,
                        })
                    }
                }
            }
            // Verarbeiten Sie finduser hier weiter
        } else {
            // Wenn identifierValue null oder undefined ist
            await interaction.reply('Die Option "identifier" enthält keinen gültigen Wert.')
        }
    }

    private static async searchUsers(searchText: string, column: ESearchType): Promise<IFindUser[]> {
        let columns = new Map<ESearchType, string>([
            [ESearchType.IDENTIFIER, 'LOWER( users.identifier ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.STEAMID, 'LOWER( users.steamid ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.LICENSE, 'LOWER( baninfo.`license` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.LIVEID, 'LOWER( baninfo.`liveid` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.XBLID, 'LOWER( baninfo.`xblid` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.DISCORD, 'LOWER( baninfo.`discord` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.PLAYERIP, 'LOWER( baninfo.`playerip` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.NAME, 'LOWER( users.`name` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.PLAYERNAME, 'LOWER( baninfo.playername) LIKE LOWER("%' + searchText + '%")'],
            [ESearchType.FIRSTNAME, 'LOWER( users.`firstname` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.LASTNAME, 'LOWER( users.`lastname` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.JOB, 'LOWER( users.`job` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.GROUP, 'LOWER( users.`group` ) LIKE LOWER( "%' + searchText + '%" )'],
            [ESearchType.PHONENUMBER, 'phone_phones.phone_number LIKE "%' + searchText + '%"'],
            [
                ESearchType.ALL,
                'LOWER( users.`identifier` ) LIKE (SELECT owned_vehicles.`owner` FROM owned_vehicles WHERE LOWER(owned_vehicles.`plate`) LIKE LOWER("%' +
                    searchText +
                    '%") LIMIT 1) OR ' +
                    'LOWER( users.`steamId` ) LIKE (SELECT owned_vehicles.`owner` FROM owned_vehicles WHERE LOWER(owned_vehicles.`plate`) LIKE LOWER("%' +
                    searchText +
                    '%") LIMIT 1) OR ' +
                    'LOWER( baninfo.`license` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( baninfo.`liveid` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( baninfo.`xblid` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( baninfo.`discord` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( baninfo.`playerip` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( users.`name` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( baninfo.playername) LIKE LOWER("%' +
                    searchText +
                    '%") OR ' +
                    'LOWER( users.identifier ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( users.steamId ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( users.`firstname` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( users.`lastname` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( users.`job` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    'LOWER( users.`group` ) LIKE LOWER( "%' +
                    searchText +
                    '%" ) OR ' +
                    "LOWER( CONCAT(users.firstname, ' ', users.lastname) ) LIKE LOWER ( \"%" +
                    searchText +
                    '%" ) OR ' +
                    'phone_phones.phone_number LIKE "%' +
                    searchText +
                    '%"',
            ],
        ])

        let query =
            'SELECT ' +
            'baninfo.playername, ' +
            'baninfo.discord, ' +
            'users.`name`, ' +
            'users.identifier, ' +
            "CONCAT(users.firstname, ' ', users.lastname) as fullname, " +
            'users.firstname, ' +
            'users.lastname, ' +
            'users.`group`, ' +
            'users.job, ' +
            'users.job_grade, ' +
            'phone_phones.phone_number, ' +
            "cast( json_extract( `users`.`accounts`, '$.bank' ) AS signed ) AS bank, " +
            "cast( json_extract( `users`.`accounts`, '$.money' ) AS signed ) AS money, " +
            "cast( json_extract( `users`.`accounts`, '$.black_money' ) AS signed ) AS black_money, " +
            'users.fraksperre, ' +
            'users.crafting_level ' +
            'FROM users ' +
            'LEFT JOIN baninfo ON users.identifier = baninfo.identifier ' +
            'JOIN phone_phones ON users.identifier = phone_phones.id ' +
            'WHERE ' +
            columns.get(column)

        try {
            const [rows] = await Database.execute(query) // Verwenden Sie await und die execute-Funktion
            return rows as IFindUser[] // Casten Sie das Ergebnis in das gewünschte Format
        } catch (error) {
            LogManager.error(error)
            return []
        }
    }

    public static async validateUser(searchString: string): Promise<IFindUser | null> {
        const user = await WhoIs.searchUsers(searchString, ESearchType.STEAMID)
        if (user === null) return null
        if (user.length === 0) return null
        return user[0]
    }
}
