import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { Helper } from '@utils/Helper'
import LogManager from '@utils/Logger'
import { CommandInteraction, EmbedBuilder } from 'discord.js'

/**
 * @author mKpwnz
 * @date 30.09.2023
 * @export
 * @abstract
 * @class Command
 */
export abstract class Command {
    AllowedChannels: string[] = []
    AllowedGroups: string[] = []
    CheckPermissions: Boolean = false
    CommandEmbed: EmbedBuilder | null = null
    RunEnvironment: EENV = EENV.DEVELOPMENT
    constructor(checkPermissions: boolean = false) {
        this.CheckPermissions = checkPermissions
    }
    abstract execute(interaction: CommandInteraction): Promise<void>
    async run(interaction: CommandInteraction): Promise<void> {
        if (this.CheckPermissions) {
            if ((await Helper.IsUserAllowed(interaction, this.AllowedChannels, this.AllowedGroups)) === false) return
        }
        if (this.RunEnvironment === EENV.DEVELOPMENT || process.env.NODE_ENV === 'development') {
            this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
            this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_BOTTESTER]
        }
        let dc_user =
            process.env.NODE_ENV === 'development' ? `DEV: ${interaction.user.id}` : `<@${interaction.user.id}>`

        LogManager.discordActionLog(
            `${dc_user} hat im Kanal <#${interaction.channelId}> den Befehl \`${
                interaction.commandName
            }\` ausgeführt.\`\`\`${JSON.stringify(interaction.options, null, 4)}\`\`\``,
        )
        this.CommandEmbed = this.updateEmbed(interaction)
        await this.execute(interaction)
    }
    updateEmbed(interaction: CommandInteraction): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(0x0792f1)
            .setTimestamp()
            .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
            .setFooter({
                text: interaction.user.displayName ?? '',
                iconURL: interaction.user.avatarURL() ?? '',
            })
            .setTimestamp(new Date())
    }
    updateEmbedWithUser(interaction: CommandInteraction): void {
        if (!this.CommandEmbed) {
            this.CommandEmbed = this.updateEmbed(interaction)
        }
        this.CommandEmbed.setFooter({
            text: interaction.user.displayName ?? '',
            iconURL: interaction.user.avatarURL() ?? '',
        })
    }
}
