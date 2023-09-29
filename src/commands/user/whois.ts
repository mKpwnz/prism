import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import db from '@proot/Bot'
import Config from '@proot/Config'
import { IFindUser } from '@sql/schema/FindUser.schema'
import { Helper } from '@utils/Helper'
import { APIEmbed, CommandInteraction, SlashCommandBuilder } from 'discord.js'

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
                    option.setName('input').setDescription('Identifier des Spielers').setRequired(true),
                ) as SlashCommandBuilder,
            this,
        )
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction
        const identifierValue = interaction.options.get('input')?.value?.toString()
        if (identifierValue) {
            console.log(identifierValue)
            const finduser: IFindUser[] = await this.searchUsers(identifierValue)
            if (finduser === null) {
                await interaction.reply({ content: 'User nicht gefunden', ephemeral: true })
            } else {
                let fields = []
                if (finduser.length > 0) {
                    for (let i = 0; i < finduser.length; i++) {
                        console.log(finduser[i])
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
                        content: `Keine Daten für "${identifierValue}"gefunden!`,
                        ephemeral: true,
                    })
                } else {
                    const embed: APIEmbed = {
                        color: 0x0099ff, // Farbe des Embeds
                        title: 'Suchergebnisse', // Titel des Embeds
                        description: `Hier sind ${fields.length} Suchergebnisse für "${identifierValue}":`, // Beschreibung des Embeds
                        fields: fields,
                        author: {
                            name: Config.Discord.BOT_NAME,
                            icon_url: Config.Pictures.Prism.LOGO_BLUE,
                        },
                    }
                    if (fields.length > 20) {
                        embed.footer = {
                            text: `${fields.length - 20} weitere Ergebnisse sind ausgeblendet!`,
                        }
                        embed.description = `Hier sind 20/${fields.length} Suchergebnisse für "${identifierValue}":`
                    }

                    channel?.send({ content: `${interaction.user.toString()}`, embeds: [embed] })
                    await interaction.reply({
                        content: 'Daten gefunden und im Chat hinterlegt!',
                        ephemeral: true,
                    })
                }
            }
            // Verarbeiten Sie finduser hier weiter
        } else {
            // Wenn identifierValue null oder undefined ist
            await interaction.reply('Die Option "identifier" enthält keinen gültigen Wert.')
        }
    }

    async searchUsers(searchText: string): Promise<IFindUser[]> {
        let query =
            'SELECT ' +
            'users.identifier, ' +
            'users.`group`, ' +
            'users.`name`, ' +
            'users.job, ' +
            'users.fraksperre, ' +
            'users.job_grade, ' +
            'users.firstname, ' +
            'users.lastname, ' +
            'users.crafting_level, ' +
            "CONCAT(users.firstname, ' ', users.lastname) as fullname, " +
            "cast( json_extract( `users`.`accounts`, '$.bank' ) AS signed ) AS bank, " +
            "cast( json_extract( `users`.`accounts`, '$.money' ) AS signed ) AS money, " +
            "cast( json_extract( `users`.`accounts`, '$.black_money' ) AS signed ) AS black_money, " +
            'baninfo.discord, ' +
            'baninfo.playername, ' +
            'phone_phones.phone_number ' +
            'FROM users ' +
            'LEFT JOIN baninfo ON users.identifier = baninfo.identifier ' +
            'JOIN phone_phones ON users.identifier = phone_phones.id ' +
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
}
