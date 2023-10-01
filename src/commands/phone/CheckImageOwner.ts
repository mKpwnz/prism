import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import LogManager from '@utils/Logger'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

// TODO: Response überarbeiten
export class CheckImageOwner extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.PRISM_DISCORDBOT]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_PRISM]
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('pcheckimageowner')
                .setDescription('Check who created an Ingame image')
                .addStringOption((option) =>
                    option.setName('imageurl').setDescription('Image URL').setRequired(true),
                ) as SlashCommandBuilder,
            this,
        )
    }
    normalizeLink(link: string): string | null {
        const match = link.match(/\/(\d+\/\d+\/[^/?]+)(?:\?.*)?$/)
        if (match) {
            return match[1]
        } else {
            return null
        }
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        try {
            const n_link = this.normalizeLink(interaction.options.get('imageurl')?.value?.toString() as string)
            if (!n_link) {
                interaction.reply({
                    content: `Der link konnte nicht validiert werden.`,
                    ephemeral: true,
                })
                return
            }
            LogManager.debug(n_link)

            const response = await Database.query(
                `
				SELECT u.firstname, u.lastname, phones.id AS steamID, photos.phone_number, photos.timestamp AS img_timestamp
				FROM phone_photos photos
				JOIN phone_phones phones ON photos.phone_number = phones.phone_number
				JOIN users u ON u.identifier = phones.id
				WHERE photos.link LIKE ?
				ORDER BY img_timestamp;
			`,
                [`%${n_link}%`],
            )
            console.log(response)
            interaction.reply({
                content: `\`\`\`json\n${JSON.stringify(response[0], null, 4)}\`\`\``,
            })
        } catch (e) {
            LogManager.error(e)
            interaction.reply({
                content: `Fehler beim ausführen des Befeheles.`,
                ephemeral: true,
            })
        }
    }
}
