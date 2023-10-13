import { Command } from '@class/Command'
import { NonEmptyArray } from '@class/NonEmptyArray'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import { ELicenses } from '@enums/Licenses'
import Config from '@proot/Config'
import { GameDB } from '@sql/Database'
import { IFindUser } from '@sql/schema/FindUser.schema'
import { IUserLicense } from '@sql/schema/License.schema'
import { Helper } from '@utils/Helper'
import LogManager from '@utils/Logger'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { ResultSetHeader } from 'mysql2'
import { WhoIs } from './WhoIs'

export class Lizenz extends Command {
    constructor() {
        super()
        this.RunEnvironment = EENV.PRODUCTION
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
        ]
        this.IsBetaCommand = true
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('lizenz')
                .setDescription('Befehle zu den IC Lizenzen')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('entfernen')
                        .setDescription('Entferne die Lizenz eines Spielers')
                        .addStringOption((option) =>
                            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
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
                            option.setName('steamid').setDescription('SteamID des Spielers').setRequired(true),
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
            this,
        )
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'entfernen') {
            await this.removeLicense(interaction)
        } else if (interaction.options.getSubcommand() === 'hinzufügen') {
            await this.addLicense(interaction)
        } else {
            await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true })
        }
    }

    private async removeLicense(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction
        const embed = this.getEmbedTemplate(interaction)
        let lizenzStr = options.getString('lizenz')
        if (!lizenzStr) {
            await interaction.reply({ content: 'Bitte gib eine Lizenz an!', ephemeral: true })
            return
        }
        let license: ELicenses
        try {
            license = Helper.enumFromValue(lizenzStr, ELicenses)
        } catch (error) {
            await interaction.reply({
                content: 'Bitte gib eine gültige Lizenz an!',
                ephemeral: true,
            })
            return
        }
        LogManager.debug(license)
        let steamid = options.getString('steamid')
        if (!steamid) {
            await interaction.reply({ content: 'Bitte gib eine SteamID an!', ephemeral: true })
            return
        }
        const vUser = await WhoIs.validateUser(steamid)
        if (!vUser) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            })
            return
        }
        let response = await Lizenz.deleteLicense(vUser, license)
        if (response instanceof Error) {
            LogManager.error(response)
            await interaction.reply({
                content: `Es ist ein Fehler beim Löschen der Lizenzen aufgetreten!\`\`\`json${JSON.stringify(
                    response,
                )}\`\`\``,
                ephemeral: true,
            })
            return
        }
        embed.setTitle('Lizenz entfernt')
        embed.setDescription(
            `
                Es wurde/n ${response.affectedRows} Lizenz/en von ${vUser.firstname} ${vUser.lastname} (\`${vUser.identifier}\`) entfernt!`,
        )
        await interaction.reply({ embeds: [embed] })
    }

    private async addLicense(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction
        const embed = this.getEmbedTemplate(interaction)
        const license = options.getString('lizenz')
        let steamid = options.getString('steamid')
        if (!steamid) {
            await interaction.reply({ content: 'Bitte gib eine SteamID an!', ephemeral: true })
            return
        }
        if (!license) {
            await interaction.reply({ content: 'Bitte gib eine Lizenz an!', ephemeral: true })
            return
        }
        const vUser = await WhoIs.validateUser(steamid)
        if (!vUser) {
            await interaction.reply({
                content: 'Es konnte kein Spieler mit dieser SteamID gefunden werden!',
                ephemeral: true,
            })
            return
        }
        try {
            let query = 'SELECT * FROM user_licenses WHERE owner = ?'
            if (license !== 'all') {
                query += ' AND type = "' + license + '"'
            }
            let [lizenzen] = await GameDB.query<IUserLicense[]>(query, [vUser.identifier])
            if (lizenzen.length !== 0) {
                await interaction.reply({
                    content: 'Der Spieler hat diese Lizenz bereits!',
                    ephemeral: true,
                })
                return
            }
            let [lizenz] = await GameDB.query<IUserLicense[]>('INSERT INTO user_licenses(type, owner) VALUES (?, ?)', [
                license,
                vUser.identifier,
            ])
            if (lizenz.length === 0) {
                await interaction.reply({
                    content: 'Es ist ein Fehler beim Hinzufügen der Lizenz aufgetreten!',
                    ephemeral: true,
                })
                return
            }
            embed.setTitle('Lizenz hinzugefügt')
            embed.setDescription(
                'Die Lizenz ' +
                    license +
                    ' wurde ' +
                    vUser.firstname +
                    ' ' +
                    vUser.lastname +
                    ' (`' +
                    vUser.identifier +
                    '`) hinzugefügt!',
            )
            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            LogManager.error(error)
            await interaction.reply({ content: 'Es ist ein Fehler aufgetreten!', ephemeral: true })
        }
    }

    public static async deleteLicense(
        vUser: IFindUser,
        licenses: ELicenses | NonEmptyArray<Exclude<ELicenses, ELicenses.ALL>>,
    ): Promise<ResultSetHeader | Error> {
        try {
            let query = 'DELETE FROM user_licenses WHERE owner = ? AND '

            if (Array.isArray(licenses)) {
                for (let license of licenses) {
                    if (!(await Lizenz.checkLicense(vUser, license))) {
                        continue
                    }
                    if (license === licenses[0]) {
                        query += '('
                    } else {
                        query += ' OR '
                    }
                    query += 'type = "' + license + '"'
                }
                query += ')'
            } else {
                LogManager.debug(licenses)
                if (licenses === ELicenses.ALL) {
                    query = 'DELETE FROM user_licenses WHERE owner = ?'
                } else {
                    if (!(await Lizenz.checkLicense(vUser, licenses))) {
                        return new Error('Der Spieler besitzt diese Lizenz nicht!')
                    }
                    query += 'type = "' + licenses + '"'
                }
            }
            const result = await GameDB.query<ResultSetHeader>(query, [vUser.identifier])
            return result[0]
        } catch (error) {
            LogManager.error(error)
            return new Error(JSON.stringify(error))
        }
    }

    public static async checkLicense(vUser: IFindUser, license: Exclude<ELicenses, ELicenses.ALL>): Promise<boolean> {
        try {
            const [result] = await GameDB.query<IUserLicense[]>(
                'SELECT * FROM user_licenses WHERE owner = ? AND type = ?',
                [vUser.identifier, license],
            )
            if (result.length === 0) {
                return false
            }
            return true
        } catch (error) {
            LogManager.error(error)
            return false
        }
    }
}
