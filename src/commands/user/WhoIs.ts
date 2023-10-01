import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { IFindUser } from '@sql/schema/FindUser.schema'
import { Helper } from '@utils/Helper'
import { APIEmbed, AttachmentBuilder, CommandInteraction, SlashCommandBuilder } from 'discord.js'
import LogManager from '@utils/Logger'

export class WhoIs extends Command {
    constructor() {
        super(false)
        this.AllowedChannels = [Config.Discord.Channel.PRISM_TEST]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('whois')
                .setDescription('Suche nach Spielern')
                //add string option
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
                .addIntegerOption((option) => option.setName('page').setDescription('Seitenzahl'))
                .addStringOption((option) =>
                    option
                        .setName('spalte')
                        .setDescription('Sucht in einer speziellen Spalte')
                        .addChoices(
                            { name: 'Identifier', value: 'identifier' },
                            { name: 'SteamID', value: 'steamid' },
                            { name: 'Lizenz', value: 'license' },
                            { name: 'LiveID', value: 'liveid' },
                            { name: 'XBLID', value: 'xblid' },
                            { name: 'Discord', value: 'discord' },
                            { name: 'PlayerIP', value: 'playerip' },
                            { name: 'Name', value: 'name' },
                            { name: 'Playername', value: 'playername' },
                            { name: 'Vorname', value: 'vorname' },
                            { name: 'Nachname', value: 'nachname' },
                            { name: 'Job', value: 'job' },
                            { name: 'Gruppe', value: 'gruppe' },
                            { name: 'Telefonnummer', value: 'phone' },
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
        if (identifierValue) {
            if (spalte === undefined || spalte === null) {
                spalte = 'all'
                filter = ''
            } else {
                filter = filter + spalte
            }
            const finduser: IFindUser[] = await this.searchUsers(identifierValue, spalte)
            if (finduser === null) {
                await interaction.reply({ content: 'User nicht gefunden', ephemeral: true })
            } else {
                if (page == undefined || page == null) {
                    page = 1
                }
                let fields = []
                if (finduser.length > 0) {
                    for (let i = 20 * (page - 1); i < finduser.length; i++) {
                        let identifier = finduser[i].identifier
                            ? finduser[i].identifier
                            : 'Unbekannt'

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
                                    (finduser[i].crafting_level -
                                        (finduser[i].crafting_level % 100)) /
                                        100
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
                        const embed: APIEmbed = {
                            color: 0x0099ff, // Farbe des Embeds
                            title: 'Suchergebnisse', // Titel des Embeds
                            description:
                                `Hier sind ${fields.length}/${finduser.length} Suchergebnisse für "${identifierValue}":` +
                                pageString, // Beschreibung des Embeds
                            fields: fields,
                            author: {
                                name: Config.Discord.BOT_NAME,
                                icon_url: Config.Pictures.Prism.LOGO_BLUE,
                            },
                        }
                        if (fields.length == 20 || page > 1) {
                            embed.footer = {
                                text: `${
                                    finduser.length - fields.length
                                } weitere Ergebnisse sind ausgeblendet!`,
                            }
                            embed.description = `Hier sind ${fields.length}/${finduser.length} Suchergebnisse für "${identifierValue}":`
                        }

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

    async searchUsers(searchText: string, column: string): Promise<IFindUser[]> {
        let columns = {
            identifier: 'LOWER( users.identifier ) LIKE LOWER( "%' + searchText + '%" )',
            steamid: 'LOWER( users.steamid ) LIKE LOWER( "%' + searchText + '%" )',
            license: 'LOWER( baninfo.`license` ) LIKE LOWER( "%' + searchText + '%" )',
            liveid: 'LOWER( baninfo.`liveid` ) LIKE LOWER( "%' + searchText + '%" )',
            xblid: 'LOWER( baninfo.`xblid` ) LIKE LOWER( "%' + searchText + '%" )',
            discord: 'LOWER( baninfo.`discord` ) LIKE LOWER( "%' + searchText + '%" )',
            playerip: 'LOWER( baninfo.`playerip` ) LIKE LOWER( "%' + searchText + '%" )',
            name: 'LOWER( users.`name` ) LIKE LOWER( "%' + searchText + '%" )',
            playername: 'LOWER( baninfo.playername) LIKE LOWER("%' + searchText + '%")',
            vorname: 'LOWER( users.`firstname` ) LIKE LOWER( "%' + searchText + '%" )',
            nachname: 'LOWER( users.`lastname` ) LIKE LOWER( "%' + searchText + '%" )',
            job: 'LOWER( users.`job` ) LIKE LOWER( "%' + searchText + '%" )',
            gruppe: 'LOWER( users.`group` ) LIKE LOWER( "%' + searchText + '%" )',
            phone: 'phone_phones.phone_number LIKE "%' + searchText + '%"',
            all:
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
        }
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
            'WHERE '
        if (Object.hasOwn(columns, column)) {
            // Spalte ist in der Liste der Spalten enthalten
            query = query + (columns as { [key: string]: string })[column]
        } else {
            // Spalte ist nicht in der Liste der Spalten enthalten
            query = query + columns.all
        }
        try {
            const [rows] = await Database.execute(query) // Verwenden Sie await und die execute-Funktion
            return rows as IFindUser[] // Casten Sie das Ergebnis in das gewünschte Format
        } catch (error) {
            LogManager.error(error)
            return []
        }
    }
}
