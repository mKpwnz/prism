import { SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'
import db from '../../Bot'
import Config from '../../Config'
import { ICommand } from '../../interfaces/ICommand'
const AllowedChannels = [Config.Discord.Channel.PRISM_TEST]
const AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER]

export const WhoIs: ICommand = {
    data: new SlashCommandBuilder()
        .setName('whois')
        .setDescription('Suche nach Spielern')
        //add string option
        .setDMPermission(true)
        .addStringOption((option) =>
            option.setName('input').setDescription('Identifier des Spielers').setRequired(true),
        ) as SlashCommandBuilder,

    run: async (interaction) => {
        const { channel, user, guild } = interaction
        //if ((await IsUserAllowed(interaction, AllowedChannels, AllowedGroups)) === false) return
        const identifierValue = interaction.options.get('input')?.value?.toString()
        if (identifierValue) {
            console.log(identifierValue)
            const finduser: IFindUser[] = await searchUsers(identifierValue)
            if (finduser === null) {
                await interaction.reply({ content: 'User nicht gefunden', ephemeral: true })
            } else {
                let fields = []
                if (finduser.length > 0) {
                    for (let i = 0; i < finduser.length; i++) {
                        console.log(finduser[i])
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

                        if (i > 20) {
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
                                        countdown(diff)
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
                                inline: true,
                            })
                        }
                    }
                }

                const embed = {
                    color: 0x0099ff, // Farbe des Embeds
                    title: 'Suchergebnisse', // Titel des Embeds
                    description: `Hier sind die Suchergebnisse für "${identifierValue}":`, // Beschreibung des Embeds
                    fields: fields,
                }
                channel?.send({ content: `${interaction.user.toString()}`, embeds: [embed] })
                await interaction.reply({
                    content: 'Daten gefunden und im Chat hinterlegt!',
                    ephemeral: true,
                })
            }
            // Verarbeiten Sie finduser hier weiter
        } else {
            // Wenn identifierValue null oder undefined ist
            await interaction.reply('Die Option "identifier" enthält keinen gültigen Wert.')
        }
    },
}

interface IFindUser {
    identifier: string
    group: string
    name: string
    job: string
    fraksperre: Date
    job_grade: number
    firstname: string
    lastname: string
    crafting_level: number
    fullname: string
    bank: number
    money: number
    black_money: number
    discord: string
    playername: string
    phone_number: string
}

async function searchUsers(searchText: string): Promise<IFindUser[]> {
    let query =
        'SELECT ' +
        'u.identifier, ' +
        'u.`group`, ' +
        'u.`name`, ' +
        'u.job, ' +
        'u.fraksperre, ' +
        'u.job_grade, ' +
        'u.firstname, ' +
        'u.lastname, ' +
        'u.crafting_level, ' +
        "CONCAT(users.firstname, ' ', users.lastname) as fullname, " +
        "cast( json_extract( `users`.`accounts`, '$.bank' ) AS signed ) AS bank, " +
        "cast( json_extract( `users`.`accounts`, '$.money' ) AS signed ) AS money, " +
        "cast( json_extract( `users`.`accounts`, '$.black_money' ) AS signed ) AS black_money, " +
        'b.discord, ' +
        'b.playername, ' +
        'p.phone_number ' +
        'FROM users u' +
        'LEFT JOIN baninfo b ON u.identifier = baninfo.identifier ' +
        'JOIN phone_phones p ON u.identifier = p.id ' +
        'WHERE ' +
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
        "JSON_EXTRACT(users.charinfo, '$.phone') LIKE \"%" +
        searchText +
        '%"'

    try {
        const [rows] = await db.execute(query) // Verwenden Sie await und die execute-Funktion
        return rows as IFindUser[] // Casten Sie das Ergebnis in das gewünschte Format
    } catch (error) {
        console.error(error)
        return []
    }
}

function numberWithCommas(x: number) {
    if (x.toString()) {
        return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, '.')
    } else {
        return x
    }
}

function decimalToHexString(number: number) {
    if (number < 0) {
        number = 0xffffffff + number + 1
    }

    return number.toString(16)
}

function countdown(s: any) {
    const d = Math.floor(s / (3600 * 24))
    s -= d * 3600 * 24
    const h = Math.floor(s / 3600)
    s -= h * 3600
    const m = Math.floor(s / 60)
    s -= m * 60
    const tmp = []
    d && tmp.push(d + 'd')
    ;(d || h) && tmp.push(h + 'h')
    ;(d || h || m) && tmp.push(m + 'm')
    tmp.push(s + 's')
    return tmp.join(' ')
}
