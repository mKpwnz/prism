import { Message } from 'discord.js'
import Config from '../Config'
import { onImageUpload } from './ImageUploadHandler'
export const onMessage = async (message: Message) => {
    if (message.channelId === Config.Discord.Channel.IMAGE_UPLOAD) {
        onImageUpload(message)
    }
}
