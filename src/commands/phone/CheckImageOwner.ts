import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { EENV } from '@enums/EENV'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import LogManager from '@utils/Logger'
import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'

interface phoneOwnerResponse extends RowDataPacket {
    firstname: string
    lastname: string
    steamID: string
    phoneNumber: string
    timestamp: string
}

// TODO: Response überarbeiten
export class CheckImageOwner extends Command {
    constructor() {
        super(true)
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED]
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_MOD,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_SUPERADMIN,
        ]
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

            const [response] = await Database.query<phoneOwnerResponse[]>(
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
