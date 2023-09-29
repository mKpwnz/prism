import axios from 'axios'
import { channel } from 'diagnostics_channel'
import { Client, Message, TextChannel } from 'discord.js'
import db from '../Bot'
import Config from '../Config'

const getUniqueId = () => {
    let dateStr = Date.now().toString(36)
    let randomStr = Math.random().toString(36).substring(2, 8)
    return `${dateStr}-${randomStr}`
}

export const onImageUpload = async (message: Message) => {
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
                let newURL = await reupload(url, message.client)
                if (newURL.length > 0) {
                    let uploaded = await uploadDB(newURL, userMessage, size)
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

//create a function to reupload an image
async function reupload(attachmentUrl: string, client: Client): Promise<string> {
    try {
        const response = await axios.get(attachmentUrl, { responseType: 'arraybuffer' })
        const randomFilename = getUniqueId()
        const formatMatch = attachmentUrl.match(/\.(png|webp|jpg)$/i)
        const fileFormat = formatMatch ? formatMatch[1] : 'jpg'
        const newFilename = `${randomFilename}.${fileFormat}`

        // Hochladen des umbenannten Bildes in den Zielkanal
        const customPicsChannel = client.channels.cache.get(
            Config.Discord.Channel.CUSTOM_PICS,
        ) as TextChannel

        if (customPicsChannel) {
            let newMessage = await customPicsChannel.send({
                files: [{ attachment: response.data, name: newFilename }],
            })
            return newMessage.attachments.first()?.url.split('?')[0] ?? ''
        } else {
            console.log('no channel found')
            return ''
        }
    } catch (error) {
        console.error(error)
        return ''
    }
}

async function uploadDB(url: string, phone: string, size: number): Promise<boolean> {
    try {
        let query =
            'INSERT INTO phone_photos (phone_number, link, size) VALUES ("' +
            phone +
            '", "' +
            url +
            '", ' +
            size +
            ')'
        const response = await db.query(query)
        if (response) {
            return true
        } else {
            return false
        }
    } catch (error) {
        console.error(error)
        return false
    }
}
