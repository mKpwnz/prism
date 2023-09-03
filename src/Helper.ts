import { CommandInteraction, TextChannel } from 'discord.js'

export async function IsUserAllowed(
    interaction: CommandInteraction,
    allowedChannels: string[],
    allowedGroups: string[],
): Promise<boolean> {
    const { channel, user, guild } = interaction

    const userRoleCache = guild?.members.cache.get(user.id)
    const userIsAllowed = allowedGroups.some((roleID) => userRoleCache?.roles.cache.has(roleID))

    if (channel instanceof TextChannel) {
        if (!allowedChannels.includes(channel.id)) {
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
        await interaction.reply({ content: 'Das ist hier nicht erlaubt. 3', ephemeral: true })
        return false
    }
}
