import { BotClient } from '@proot/Bot'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { IItems } from '@sql/schema/Items.schema'
import { CommandInteraction, GuildEmoji, TextChannel } from 'discord.js'
import LogManager from './Logger'

export class Helper {
    /**
     * @description Checks if the user is allowed to execute the command
     * @author mKpwnz
     * @date 09.10.2023
     * @static
     * @param {CommandInteraction} interaction
     * @param {string[]} [allowedChannels=[]]
     * @param {string[]} [allowedGroups=[]]
     * @param {string[]} [allowedUsers=[]]
     * @param {string[]} [blockedUsers=[]]
     * @returns {*}  {Promise<boolean>}
     * @memberof Helper
     */
    static async IsUserAllowed(
        interaction: CommandInteraction,
        allowedChannels: string[] = [],
        allowedGroups: string[] = [],
        allowedUsers: string[] = [],
        blockedUsers: string[] = [],
    ): Promise<boolean> {
        const { channel, user, guild } = interaction
        if (!guild) return false

        const userRoleCache = guild.members.cache.get(user.id)
        var userIsAllowed = false

        if (allowedUsers.length == 0) {
            userIsAllowed = true
        } else if (allowedGroups.some((roleID) => userRoleCache?.roles.cache.has(roleID))) {
            userIsAllowed = true
        } else if (allowedUsers.includes(user.id)) {
            userIsAllowed = true
        }
        if (blockedUsers.includes(user.id)) {
            userIsAllowed = false
        }
        if (Config.Discord.Users.GlobalBlocked.includes(user.id)) {
            userIsAllowed = false
        }
        if (Config.Discord.Users.GlobalWhitelist.includes(user.id)) {
            userIsAllowed = true
        }

        if (channel instanceof TextChannel) {
            if (allowedChannels.length > 0 && !allowedChannels.includes(channel.id)) {
                await interaction.reply({
                    content: 'Dieser Command kann in diesem Channel nicht ausgeführt werden.',
                    ephemeral: true,
                })
                return false
            }
            if (!userIsAllowed) {
                await interaction.reply({
                    content: 'Du hast leider keine Berechtigungen für den Command',
                    ephemeral: true,
                })
                return false
            }
            return true
        } else {
            await interaction.reply({
                content: 'Dieser Command kann in diesem Channel nicht ausgeführt werden.',
                ephemeral: true,
            })
            return false
        }
    }

    /**
     * @description
     * @author Cobra
     * @date 29.09.2023
     * @static
     * @param {number} input
     * @returns {*}  {string}
     * @memberof Helper
     */
    static numberWithCommas(input: number): string {
        if (input.toString()) {
            return input.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, '.')
        } else {
            return input.toString()
        }
    }

    /**
     * @description
     * @author Cobra
     * @date 29.09.2023
     * @static
     * @param {number} number
     * @returns {*}  {string}
     * @memberof Helper
     */
    static decimalToHexString(number: number): string {
        if (number < 0) {
            number = 0xffffffff + number + 1
        }
        return number.toString(16)
    }

    /**
     * @description
     * @author mKpwnz
     * @date 29.09.2023
     * @static
     * @param {number} seconds
     * @returns {*}  {string}
     * @memberof Helper
     */
    static secondsToTimeString(seconds: number): string {
        const days = Math.floor(seconds / (3600 * 24))
        seconds -= days * 3600 * 24
        const hours = Math.floor(seconds / 3600)
        seconds -= hours * 3600
        const minutes = Math.floor(seconds / 60)
        seconds -= minutes * 60
        const tmp = []
        days && tmp.push(days + 'd')
        ;(days || hours) && tmp.push(hours + 'h')
        ;(days || hours || minutes) && tmp.push(minutes + 'm')
        tmp.push(seconds + 's')
        return tmp.join(' ')
    }

    /**
     * @description Generates a unique ID based on the current timestamp and a random string
     * @author mKpwnz
     * @date 30.09.2023
     * @static
     * @returns {*}  {string}
     * @memberof Helper
     */
    static getUniqueId(): string {
        let dateStr = Date.now().toString(36)
        let randomStr = Math.random().toString(36).substring(2, 8)
        return `${dateStr}-${randomStr}`
    }

    /**
     * @description Validates a numberplate and returns a valid one with 8 characters (including spaces) or an empty string if the input is invalid
     * @author mKpwnz
     * @date 06.10.2023
     * @static
     * @param {string} platetext
     * @returns {*}  {string}
     * @memberof Helper
     */
    static validateNumberplate(platetext: string): string {
        platetext = platetext.toUpperCase().replace(/[^A-Z0-9 ]*/g, '')
        if (platetext.length == 0) {
            return '        '
        } else if (platetext.length == 8) {
            return platetext
        } else if (platetext.length > 8) {
            return platetext.slice(0, 8)
        } else {
            while (platetext.length < 8) {
                if (platetext.length % 2 == 0) {
                    platetext = ' ' + platetext
                } else {
                    platetext += ' '
                }
                if (platetext.length == 8) {
                    return platetext
                }
            }
        }
        return platetext
    }

    /**
     * @description
     * @author sirjxsh
     * @date 09.10.2023
     * @static
     * @param {string} itemName
     * @returns {*}  {Promise<string>}
     * @memberof Helper
     */
    static async validateItemName(itemName: string): Promise<string> {
        itemName = itemName.toLowerCase()
        itemName = '%' + itemName + '%'
        try {
            let [item] = await Database.query<IItems[]>('SELECT * FROM items WHERE name LIKE ?', [
                itemName,
            ])
            if (item.length > 0) {
                return item[0].name
            }
            return ''
        } catch (error) {
            LogManager.error(error)
            return ''
        }
    }

    /**
     * @description
     * @author sirsxsh
     * @date 09.10.2023
     * @static
     * @param {string} weaponName
     * @returns {*}  {string}
     * @memberof Helper
     */
    static validateWeaponName(weaponName: string): string {
        LogManager.log(weaponName)
        if (!weaponName.startsWith('WEAPON_')) {
            weaponName = `WEAPON_${weaponName.toUpperCase()}`
        }
        LogManager.log(weaponName)
        let weaponList = [
            'WEAPON_DAGGER',
            'WEAPON_BAT',
            'WEAPON_BOTTLE',
            'WEAPON_CROWBAR',
            'WEAPON_FLASHLIGHT',
            'WEAPON_GOLFCLUB',
            'WEAPON_HAMMER',
            'WEAPON_HATCHET',
            'WEAPON_KNUCKLE',
            'WEAPON_KNIFE',
            'WEAPON_MACHETE',
            'WEAPON_SWITCHBLADE',
            'WEAPON_PISTOL',
            'WEAPON_PISTOL_MK2',
            'WEAPON_COMBATPISTOL',
            'WEAPON_APPISTOL',
            'WEAPON_STUNGUN',
            'WEAPON_PISTOL50',
            'WEAPON_SNSPISTOL',
            'WEAPON_SNSPISTOL_MK2',
            'WEAPON_HEAVYPISTOL',
            'WEAPON_VINTAGEPISTOL',
            'WEAPON_FLAREGUN',
            'WEAPON_MARKSMANPISTOL',
            'WEAPON_MICROSMG',
            'WEAPON_SMG',
            'WEAPON_SMG_MK2',
            'WEAPON_ASSAULTSMG',
            'WEAPON_COMBATPDW',
            'WEAPON_MACHINEPISTOL',
            'WEAPON_MINISMG',
            'WEAPON_RAYCARBINE',
            'WEAPON_PUMPSHOTGUN',
            'WEAPON_PUMPSHOTGUN_MK2',
            'WEAPON_SAWNOFFSHOTGUN',
            'WEAPON_ASSAULTSHOTGUN',
            'WEAPON_BULLPUPSHOTGUN',
            'WEAPON_MUSKET',
            'WEAPON_HEAVYSHOTGUN',
            'WEAPON_DBSHOTGUN',
            'WEAPON_AUTOSHOTGUN',
            'WEAPON_ASSAULTRIFLE',
            'WEAPON_ASSAULTRIFLE_MK2',
            'WEAPON_CARBINERIFLE',
            'WEAPON_CARBINERIFLE_MK2',
            'WEAPON_ADVANCEDRIFLE',
            'WEAPON_SPECIALCARBINE',
            'WEAPON_SPECIALCARBINE_MK2',
            'WEAPON_BULLPUPRIFLE',
            'WEAPON_BULLPUPRIFLE_MK2',
            'WEAPON_COMPACTRIFLE',
            'WEAPON_MG',
            'WEAPON_COMBATMG',
            'WEAPON_COMBATMG_MK2',
            'WEAPON_GUSENBERG',
            'WEAPON_SNIPERRIFLE',
            'WEAPON_HEAVYSNIPER',
            'WEAPON_HEAVYSNIPER_MK2',
            'WEAPON_MARKSMANRIFLE',
            'WEAPON_MARKSMANRIFLE_MK2',
            'WEAPON_RPG',
            'WEAPON_GRENADELAUNCHER',
            'WEAPON_GRENADELAUNCHER_SMOKE',
            'WEAPON_MINIGUN',
            'WEAPON_FIREWORK',
            'WEAPON_RAILGUN',
            'WEAPON_HOMINGLAUNCHER',
            'WEAPON_COMPACTLAUNCHER',
            'WEAPON_RAYMINIGUN',
            'WEAPON_GRENADE',
            'WEAPON_BZGAS',
            'WEAPON_SMOKEGRENADE',
            'WEAPON_FLARE',
            'WEAPON_MOLOTOV',
            'WEAPON_STICKYBOMB',
            'WEAPON_PROXMINE',
            'WEAPON_SNOWBALL',
            'WEAPON_PIPEBOMB',
            'WEAPON_BALL',
            'WEAPON_PARACHUTE',
            'WEAPON_FIREEXTINGUISHER',
            'WEAPON_PETROLCAN',
            'WEAPON_HARZARDCAN',
            'WEAPON_STUNSHOT',
        ]
        LogManager.debug(weaponList.includes(weaponName))
        if (!weaponList.includes(weaponName)) {
            LogManager.log('Weapon not found')
            return ''
        } else {
            LogManager.log('Weapon found')
            return weaponName
        }
    }

    /**
     * @description
     * @author mKpwnz
     * @date 09.10.2023
     * @static
     * @param {string} emoteName
     * @returns {*}  {(string | null)}
     * @memberof Helper
     */
    static async getEmote(emoteName: string): Promise<GuildEmoji | null> {
        const guild = BotClient.guilds.cache.get(Config.Discord.ServerID)
        if (!guild) return null
        var emoteData = await guild.emojis.fetch()
        return emoteData.find((e) => e.name === emoteName) ?? null
    }

    /**
     * @description
     * @author mKpwnz
     * @date 11.10.2023
     * @static
     * @param {string} val
     * @param {T} _enum
     * @memberof Helper
     */
    static enumFromValue = <T extends Record<string, string>>(val: string, _enum: T) => {
        const enumName = (Object.keys(_enum) as Array<keyof T>).find((k) => _enum[k] === val)
        if (!enumName) throw Error()
        return _enum[enumName]
    }
}
