import { Player } from '@controller/Player.controller'
import { ValidatedPlayer } from '@ctypes/ValidatedPlayer'
import { ButtonBuilder } from '@discordjs/builders'
import { EUniqueIdentifier } from '@enums/ESearchType'
import Config from '@proot/Config'
import { GameDB } from '@sql/Database'
import { Helper } from '@utils/Helper'
import LogManager from '@utils/Logger'
import axios from 'axios'
import {
    ActionRowBuilder,
    Attachment,
    ButtonStyle,
    Client,
    EmbedBuilder,
    Interaction,
    Message,
    ModalBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'

export class CustomImageUpload {
    private client: Client | null
    private input_phoneNumber: string = ''
    private input_reason: string = ''
    private input_imageUrl: string = ''
    private image_attachment: Attachment | null = null
    private message_image_upload: Message | null = null
    private imageLimitations: { height: number; width: number; size: number } = {
        height: 1280,
        width: 1280,
        size: 1024 * 800,
    }
    private vPlayer: ValidatedPlayer | null = null

    constructor(client: Client) {
        this.client = client
        let channel =
            process.env.NODE_ENV === 'production'
                ? Config.Discord.Channel.WHOIS_IMAGEUPLOAD
                : Config.Discord.Channel.WHOIS_TESTI
        client.on('messageCreate', async (message: Message) => {
            if (message.channelId === channel) {
                this.onMessage(message)
            }
        })
        client.on('interactionCreate', async (interaction: Interaction) => {
            this.onInteract(interaction)
        })
    }
    resetValues() {
        this.input_phoneNumber = ''
        this.input_reason = ''
        this.input_imageUrl = ''
        this.image_attachment = null
        this.message_image_upload = null
    }
    async onMessage(message: Message) {
        if (message.author.bot) return

        if (message.attachments.size > 0) {
            this.message_image_upload = message
            this.input_imageUrl = message.attachments.first()?.url || ''
            this.image_attachment = message.attachments.first() || null

            const { success, messages } = this.validateImage()
            if (!success) {
                var responseMSG = await message.reply({
                    content: `Es sind Fehler aufgetreten: \`\`\`${messages.join('\n')}\`\`\``,
                })
                await this.message_image_upload?.delete()
                this.resetValues()
                await setTimeout(async () => {
                    await responseMSG.delete()
                }, 15000)
                return
            } else {
                await message.reply({
                    content:
                        'Bitte weise das Bild in den nächsten 60 Sekunden zu. Nach den 60 Sekunden wird das Bild automatisch gelöscht.',
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setLabel('Bild zuweisen')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('phone_ciu_assign_image'),
                        ),
                    ],
                })
            }
        } else {
            if (Config.Discord.Channel.WHOIS_IMAGEUPLOAD) message.delete()
        }
    }
    async onInteract(interaction: Interaction) {
        const phone_ciu_modal = new ModalBuilder().setCustomId('phone_ciu_modal').setTitle('Bild an Spieler zuweisen')
        const phone_ciu_in_phoneNumber = new TextInputBuilder()
            .setCustomId('phone_ciu_in_phoneNumber')
            .setLabel('Telefonnummer des Spielers')
            .setStyle(TextInputStyle.Short)
            .setValue('')
            .setRequired(true)

        const phone_ciu_in_reason = new TextInputBuilder()
            .setCustomId('phone_ciu_in_reason')
            .setLabel('Begründung')
            .setStyle(TextInputStyle.Paragraph)
            .setValue('')
            .setRequired(true)

        phone_ciu_modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(phone_ciu_in_phoneNumber),
            new ActionRowBuilder<TextInputBuilder>().addComponents(phone_ciu_in_reason),
        )

        if (interaction.isButton() && interaction.customId === 'phone_ciu_assign_image') {
            await interaction.message.delete()
            await interaction.showModal(phone_ciu_modal)
            const img = this.message_image_upload

            setTimeout(async () => {
                try {
                    if (img) await img.delete()
                } catch (e) {}
                this.resetValues()
            }, 60000)
        }
        if (interaction.isButton() && interaction.customId === 'phone_ciu_assign_conf_no') {
            if (interaction.message) await interaction.message.delete()
            if (this.message_image_upload) await this.message_image_upload?.delete()
            this.resetValues()
        }
        if (interaction.isButton() && interaction.customId === 'phone_ciu_assign_conf_yes') {
            if (interaction.message) await interaction.message.delete()

            const newImageUrl = await this.reuploadImage()
            const result = await this.assignImageToPlayer(
                newImageUrl,
                this.input_phoneNumber,
                this.image_attachment?.size || 0,
            )
            if (result) {
                await this.message_image_upload?.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x0792f1)
                            .setTitle('Custom Image Upload')
                            .setAuthor({
                                name: Config.Discord.BOT_NAME,
                                iconURL: Config.Pictures.Prism.LOGO_BLUE,
                            })
                            .addFields(
                                {
                                    name: 'Freigegeben durch',
                                    value: `${interaction.user.displayName}`,
                                    inline: true,
                                },
                                {
                                    name: 'Freigegeben durch (Discord)',
                                    value: `<@${interaction.user.id}>`,
                                    inline: true,
                                },
                                {
                                    name: 'Hochgeladen auf Handy',
                                    value: `${this.vPlayer?.playerdata.fullname} (${this.vPlayer?.playerdata.phonenumber})`,
                                    inline: true,
                                },
                                { name: 'Begründung', value: this.input_reason },
                            )
                            .setImage(newImageUrl)
                            .setTimestamp()
                            .setFooter({ text: 'Upload by PRISM BOT' }),
                    ],
                })
            } else {
                await interaction.reply({
                    content: `Es ist ein Fehler aufgetreten. Bitte versuche es erneut.`,
                    ephemeral: true,
                })
                await this.message_image_upload?.delete()
                this.resetValues()
                return
            }

            if (this.message_image_upload) await this.message_image_upload.delete()
        }
        if (interaction.isModalSubmit() && interaction.customId === 'phone_ciu_modal') {
            this.input_phoneNumber = interaction.fields.getTextInputValue('phone_ciu_in_phoneNumber')
            this.input_reason = interaction.fields.getTextInputValue('phone_ciu_in_reason')

            this.vPlayer = await Player.validatePlayer(this.input_phoneNumber, EUniqueIdentifier.PHONENUMBER)
            const { success, messages } = this.validateInput()
            if (!success || !this.vPlayer) {
                await interaction.reply({
                    content: `Es sind Fehler aufgetreten: \`\`\`${messages.join('\n')}\`\`\``,
                    ephemeral: true,
                })
                await this.message_image_upload?.delete()
                this.resetValues()
                return
            }

            await interaction.reply({
                content: `Möchte du das Bild wirklich an ${this.vPlayer.playerdata.fullname} (${this.input_phoneNumber}) zuweisen?`,
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setLabel('Abbrechen')
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId('phone_ciu_assign_conf_no'),
                        new ButtonBuilder()
                            .setLabel('Zuweisen')
                            .setStyle(ButtonStyle.Success)
                            .setCustomId('phone_ciu_assign_conf_yes'),
                    ),
                ],
            })
        }
    }
    validateImage() {
        const response: { success: boolean; messages: string[] } = {
            success: false,
            messages: [],
        }
        if (this.image_attachment) {
            const { height, width, size } = this.image_attachment
            const url = this.image_attachment.url.split('?')[0]
            if (!new RegExp('(.*?)\\.(jpg|jpeg|webp|png)').test(url)) {
                response.messages.push('Das Bild muss eine .jpg, .jpeg, .webp oder .png Datei sein.')
            }
            if (!height) response.messages.push('Die Höhe des Bildes konnte nicht ermittelt werden.')
            if (!width) response.messages.push('Die Breite des Bildes konnte nicht ermittelt werden.')
            if (!size) response.messages.push('Die Dateigröße des Bildes konnte nicht ermittelt werden.')

            if (size > this.imageLimitations.size) response.messages.push('Das Bild darf nicht größer als 800kb sein.')

            if (width && width > this.imageLimitations.width)
                response.messages.push(`Das Bild darf nicht breiter als ${this.imageLimitations.width} Pixel sein.`)
            if (height && height > this.imageLimitations.height)
                response.messages.push(`Das Bild darf nicht höher als ${this.imageLimitations.height} Pixel sein.`)
        } else {
            response.messages.push('Es wurde kein Bild angehängt.')
        }
        if (response.messages.length === 0) response.success = true
        return response
    }
    validateInput(): { success: boolean; messages: string[] } {
        const response: { success: boolean; messages: string[] } = {
            success: false,
            messages: [],
        }

        if (!new RegExp(/^01726\d{5}$/).test(this.input_phoneNumber) || !this.vPlayer)
            response.messages.push('Die Telefonnummer ist ungültig.')

        if (response.messages.length === 0) response.success = true
        return response
    }
    async reuploadImage(): Promise<string> {
        if (this.input_imageUrl && this.client) {
            const response = await axios.get(this.input_imageUrl, { responseType: 'arraybuffer' })
            const formatMatch = this.input_imageUrl.match(/\.(png|webp|jpg|jpeg)$/i)
            const fileFormat = formatMatch ? formatMatch[1] : 'jpg'
            const newFilename = `${Helper.getUniqueId()}.${fileFormat}`

            const customPicsChannel = this.client.channels.cache.get(
                Config.Discord.Channel.WHOIS_CUSTOMPICS_DATASTORE,
            ) as TextChannel

            if (customPicsChannel) {
                let newMessage = await customPicsChannel.send({
                    files: [{ attachment: response.data, name: newFilename }],
                })
                return newMessage.attachments.first()?.url.split('?')[0] ?? ''
            } else {
                LogManager.log('no channel found')
                return ''
            }
        } else {
            return ''
        }
    }
    async assignImageToPlayer(url: string, phone: string, size: number): Promise<boolean> {
        try {
            let query =
                'INSERT INTO phone_photos (phone_number, link, size) VALUES ("' +
                phone +
                '", "' +
                url +
                '", ' +
                size / 1000 +
                ')'
            const response = await GameDB.query(query)
            if (response) {
                return true
            } else {
                return false
            }
        } catch (error) {
            LogManager.error(error)
            return false
        }
    }
}
