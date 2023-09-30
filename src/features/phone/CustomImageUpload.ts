import Config from '@proot/Config'
import { Database } from '@sql/Database'
import { Helper } from '@utils/Helper'
import LogManager from '@utils/Logger'
import axios from 'axios'
import { Client, Message, TextChannel } from 'discord.js'

export class CustomImmageUpload {
    static async onImageUpload(message: Message) {
        if (message.author.bot) return
        const attachment = message.attachments.first()
        const userMessage = message.content
        const numberCheck = new RegExp(/^01726\d{5}$/)
        const validnumber = numberCheck.test(userMessage)

        if (attachment && validnumber) {
            const { height, width, size } = attachment
            let reply = 'Dein Bild verstößt gegen unsere Regeln.'
            const url = attachment.url.split('?')[0]
            let regexp = new RegExp('(.*?)\\.(jpg|webp|png)')
            let formatMatch = regexp.test(url)
            if (height && width && size && formatMatch) {
                const isValid = height <= 1280 && width <= 1280 && size <= 800000

                if (height > 1280) {
                    reply += ' Dein Bild ist zu hoch.'
                }
                if (width > 1280) {
                    reply += ' Dein Bild ist zu breit.'
                }
                if (size > 800000) {
                    reply += ' Dein Bild ist zu groß.'
                }

                if (!isValid) {
                    await message.reply({
                        content: reply,
                        allowedMentions: { repliedUser: true },
                    })
                    await message.delete()
                } else {
                    let newURL = await CustomImmageUpload.reupload(url, message.client)
                    if (newURL.length > 0) {
                        let uploaded = await CustomImmageUpload.uploadDB(newURL, userMessage, size)
                        if (uploaded) {
                            await message.react('✅')
                        } else {
                            await message.react('❌')
                            await message.reply('Es konnte nicht in der Datenbank gespeichert werden')
                        }
                    } else {
                        await message.reply('Es konnte keine URL generiert werden.')
                    }
                }
            }
        } else {
            if (!validnumber) {
                //react to message and delete
                await message.reply('Bitte gib eine gültige Telefonnummer an.')
            } else if (!attachment) {
                await message.reply('Bitte füge ein Bild an.')
            } else {
                await message.reply('Unbekannter Fehler')
            }
            await message.delete()
        }
    }

    /**
     * @description Reuploads the image to the target channel and returns the new url
     * @author sirsxsh
     * @date 30.09.2023
     * @static
     * @param {string} attachmentUrl
     * @param {Client} client
     * @returns {*}  {Promise<string>}
     * @memberof CustomImmageUpload
     */
    static async reupload(attachmentUrl: string, client: Client): Promise<string> {
        try {
            const response = await axios.get(attachmentUrl, { responseType: 'arraybuffer' })
            const formatMatch = attachmentUrl.match(/\.(png|webp|jpg)$/i)
            const fileFormat = formatMatch ? formatMatch[1] : 'jpg'
            const newFilename = `${Helper.getUniqueId()}.${fileFormat}`

            // Hochladen des umbenannten Bildes in den Zielkanal
            const customPicsChannel = client.channels.cache.get(Config.Discord.Channel.CUSTOM_PICS) as TextChannel

            if (customPicsChannel) {
                let newMessage = await customPicsChannel.send({
                    files: [{ attachment: response.data, name: newFilename }],
                })
                return newMessage.attachments.first()?.url.split('?')[0] ?? ''
            } else {
                LogManager.log('no channel found')
                return ''
            }
        } catch (error) {
            LogManager.error(error)
            return ''
        }
    }

    /**
     * @description Uploads the image to the database and returns true if successful, false if not successful or error occured. (Error will be logged to console.)
     * @author sirsxsh
     * @date 30.09.2023
     * @static
     * @param {string} url
     * @param {string} phone
     * @param {number} size
     * @returns {*}  {Promise<boolean>}
     * @memberof CustomImmageUpload
     */
    static async uploadDB(url: string, phone: string, size: number): Promise<boolean> {
        try {
            let query =
                'INSERT INTO phone_photos (phone_number, link, size) VALUES ("' +
                phone +
                '", "' +
                url +
                '", ' +
                size +
                ')'
            const response = await Database.query(query)
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
