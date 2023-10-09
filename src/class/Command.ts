import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { Helper } from '@utils/Helper'
import LogManager from '@utils/Logger'
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'

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
    AllowedUsers: string[] = []
    BlockedUsers: string[] = []
    CheckPermissions: Boolean = true
    RunEnvironment: EENV = EENV.DEVELOPMENT
    IsBetaCommand: boolean = false
    constructor() {}
    abstract execute(interaction: ChatInputCommandInteraction): Promise<void>
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options, user } = interaction

        // Override Channel in Devmode
        if (this.RunEnvironment != EENV.PRODUCTION) {
            this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
            this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_BOTTESTER]
        }

        // Check Permissions
        if (this.CheckPermissions) {
            if (
                (await Helper.IsUserAllowed(
                    interaction,
                    this.AllowedChannels,
                    this.AllowedGroups,
                    this.AllowedUsers,
                    this.BlockedUsers,
                )) === false
            )
                return
        }

        let inputFields: { name: string; value: string }[] = []
        options.data.forEach((input) => {
            var d = JSON.parse(JSON.stringify(input))
            inputFields.push({ name: d['name'], value: d['value'] })
        })
        var cmdPrint = {
            user: {
                displayame: user.displayName,
                id: user.id,
            },
            command: interaction.commandName,
            options: inputFields,
        }
        LogManager.discordActionLog(
            `\` ${interaction.user.displayName} (${user.id}) \` hat im Kanal <#${interaction.channelId}> den Befehl \`${
                interaction.commandName
            }\` ausgeführt:\`\`\`json\n${JSON.stringify(cmdPrint, null, 4)}\`\`\``,
        )

        try {
            await this.execute(interaction)
        } catch (error) {
            LogManager.error(error)
            await interaction.reply({
                content: `Es ist ein Fehler aufgetreten!\`\`\`json${JSON.stringify(error)}\`\`\``,
                ephemeral: true,
            })
        }
    }
    getEmbedTemplate(interaction: ChatInputCommandInteraction): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(0x0792f1)
            .setTimestamp()
            .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
            .setFooter({
                text: interaction.user.displayName ?? '',
                iconURL: interaction.user.avatarURL() ?? '',
            })
            .setTimestamp(new Date())
            .setImage(Config.Pictures.WHITESPACE)
    }
}
