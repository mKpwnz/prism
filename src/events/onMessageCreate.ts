import { DCEvent } from '@class/DCEvent'
import { CustomImmageUpload } from '@features/phone/CustomImageUpload'
import Config from '@proot/Config'
import { Message } from 'discord.js'

export class onMessageCreate extends DCEvent {
    async process(message: Message): Promise<void> {}
}
