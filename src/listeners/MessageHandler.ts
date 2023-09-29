import { Message } from 'discord.js'
import { onImageUpload } from './ImageUploadHandler'
import Config from '@proot/Config'

export const onMessage = async (message: Message) => {
    if (message.channelId === Config.Discord.Channel.IMAGE_UPLOAD) {
        onImageUpload(message)
    }
}
