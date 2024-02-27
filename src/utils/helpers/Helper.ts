import Config from '@Config';
import { EmoteManager } from '@manager/EmoteManager';
import { AttachmentBuilder, CommandInteraction, GuildEmoji, TextChannel } from 'discord.js';

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
        const { channel, user, guild } = interaction;
        if (!guild) return false;

        const userRoleCache = guild.members.cache.get(user.id);
        let userIsAllowed = false;

        if (allowedUsers.length === 0) {
            userIsAllowed = true;
        } else if (allowedGroups.some((roleID) => userRoleCache?.roles.cache.has(roleID))) {
            userIsAllowed = true;
        } else if (allowedUsers.includes(user.id)) {
            userIsAllowed = true;
        }
        if (blockedUsers.includes(user.id)) {
            userIsAllowed = false;
        }
        if (Config.Bot.GlobalBlockedUsers.includes(user.id)) {
            userIsAllowed = false;
        }
        if (Config.Bot.GlobalWhitelistUsers.includes(user.id)) {
            userIsAllowed = true;
        }

        if (channel instanceof TextChannel) {
            if (allowedChannels.length > 0 && !allowedChannels.includes(channel.id)) {
                await interaction.reply({
                    content: 'Dieser Command kann in diesem Channel nicht ausgeführt werden.',
                    ephemeral: true,
                });
                return false;
            }
            if (!userIsAllowed) {
                await interaction.reply({
                    content: 'Du hast leider keine Berechtigungen für den Command',
                    ephemeral: true,
                });
                return false;
            }
            return true;
        }
        await interaction.reply({
            content: 'Dieser Command kann in diesem Channel nicht ausgeführt werden.',
            ephemeral: true,
        });
        return false;
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
            return input.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, '.');
        }
        return input.toString();
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
            number = 0xffffffff + number + 1;
        }
        return number.toString(16);
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
        const days = Math.floor(seconds / (3600 * 24));
        seconds -= days * 3600 * 24;
        const hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;
        const minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        const tmp = [];
        if (days) tmp.push(`${days}d`);
        if (days || hours) tmp.push(`${hours}h`);
        if (days || hours || minutes) tmp.push(`${minutes}m`);
        tmp.push(`${seconds}s`);
        return tmp.join(' ');
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
        const dateStr = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `${dateStr}-${randomStr}`;
    }

    /**
     * @description Formats a numberplate and returns a valid one with 8 characters (including spaces) or an empty string if the input is invalid
     * @author mKpwnz
     * @date 06.10.2023
     * @static
     * @param {string} platetext
     * @returns {*}  {string}
     * @memberof Helper
     */
    static formatNumberplate(platetext: string): string {
        platetext = platetext.toUpperCase().replace(/[^A-Z0-9 ]*/g, '');
        if (platetext.length === 0) {
            return '        ';
        }
        if (platetext.length === 8) {
            return platetext;
        }
        if (platetext.length > 8) {
            return platetext.slice(0, 8);
        }
        while (platetext.length < 8) {
            if (platetext.length % 2 === 0) {
                platetext = ` ${platetext}`;
            } else {
                platetext += ' ';
            }
            if (platetext.length === 8) {
                return platetext;
            }
        }

        return platetext;
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
    static validateWeaponName(weaponName: string): string | null {
        if (!weaponName.startsWith('WEAPON_')) {
            weaponName = `WEAPON_${weaponName.toUpperCase()}`;
        }
        const weaponList = [
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
        ];
        if (!weaponList.includes(weaponName)) {
            return null;
        }
        return weaponName;
    }

    /**
     * @description
     * @author mKpwnz
     * @date 09.10.2023
     * @static
     * @param {string} emoteName
     * @returns {*}  {(string | null)}
     * @deprecated Use getEmote in EmoteManager instead
     * @memberof Helper
     */
    static async getEmote(emoteName: string, serverid: string): Promise<GuildEmoji | null> {
        return EmoteManager.getEmote(emoteName, serverid);
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
        const enumName = (Object.keys(_enum) as Array<keyof T>).find((k) => _enum[k] === val);
        if (!enumName) throw Error();
        return _enum[enumName];
    };

    /**
     * @description Validates a date string in the format dd.mm.yyyy and returns true if it is valid, false if not
     * @author Etox
     * @date 28.12.2023
     * @param {string} date
     * @returns {boolean}
     * @memberof Helper
     */
    static validateDate(date: string): boolean {
        return /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(date);
    }

    /**
     * @description
     * @author mKpwnz
     * @date 28.12.2023
     * @static
     * @param {number} ms
     * @returns {*}  {Promise<void>}
     * @memberof Helper
     */
    static promiseTimeout(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    /**
     * @description Generates the hash of a string using the One-At-A-Time (OAAT) hash function
     * @author mKpwnz
     * @date 14.02.2024
     * @static
     * @param {string} inputText
     * @returns {*}  {number}
     * @memberof Helper
     */
    static generateOAAThash(inputText: string): number {
        const input = inputText.toLowerCase();
        let hash = 0;
        for (let i = 0; i < input.length; ++i) {
            hash += input.charCodeAt(i);
            hash += hash << 10;
            hash ^= hash >>> 6;
        }
        hash += hash << 3;
        hash ^= hash >>> 11;
        hash += hash << 15;
        return (hash >>> 0) >> 0;
    }

    /**
     * @description Creates a new AttachmentBuilder from a JSON string and a filename. The filename will be prefixed with "PRISM_" and the current date and time in the format "dd.mm.yyyy_hh:mm:ss".
     * @author mKpwnz
     * @date 15.02.2024
     * @static
     * @param {string} jsonInput
     * @param {string} filename
     * @returns {*}  {AttachmentBuilder}
     * @memberof Helper
     */
    static attachmentFromJson(jsonInput: string, filename: string): AttachmentBuilder {
        return new AttachmentBuilder(Buffer.from(jsonInput, 'utf-8'), {
            name: `PRISM_${filename}_${new Date().toLocaleString('de-DE')}.json`,
        });
    }

    /**
     * @description Creates a new AttachmentBuilder from an object and a filename. The object will be stringified with 4 spaces indentation and the filename will be prefixed with "PRISM_" and the current date and time in the format "dd.mm.yyyy_hh:mm:ss".
     * @author mKpwnz
     * @date 15.02.2024
     * @static
     * @param {*} objInput
     * @param {string} filename
     * @returns {*}  {AttachmentBuilder}
     * @memberof Helper
     */
    static attachmentFromObject(objInput: any, filename: string): AttachmentBuilder {
        return Helper.attachmentFromJson(JSON.stringify(objInput, null, 4), filename);
    }
}
