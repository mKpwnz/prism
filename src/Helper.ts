import { CommandInteraction, TextChannel } from 'discord.js'

/**
 * @description Checks if the user is allowed to execute the command
 * @author mKpwnz
 * @date 04.09.2023
 * @export
 * @param {CommandInteraction} interaction
 * @param {string[]} [allowedChannels=[]]
 * @param {string[]} [allowedGroups=[]]
 * @returns {*}  {Promise<boolean>}
 */
export async function IsUserAllowed(
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
