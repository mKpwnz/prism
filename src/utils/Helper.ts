import { CommandInteraction, TextChannel } from 'discord.js'

export class Helper {
    /**
     * @description Checks if the user is allowed to execute the command
     * @author mKpwnz
     * @date 29.09.2023
     * @static
     * @param {CommandInteraction} interaction
     * @param {string[]} [allowedChannels=[]]
     * @param {string[]} [allowedGroups=[]]
     * @returns {*}  {Promise<boolean>}
     * @memberof Helper
     */
    static async IsUserAllowed(
        interaction: CommandInteraction,
        allowedChannels: string[] = [],
        allowedGroups: string[] = [],
    ): Promise<boolean> {
        const { channel, user, guild } = interaction

        const userRoleCache = guild?.members.cache.get(user.id)
        const userIsAllowed =
            allowedGroups.length > 0 ? allowedGroups.some((roleID) => userRoleCache?.roles.cache.has(roleID)) : true

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
}
