import { DCEvent } from '@class/DCEvent'
import { Message } from 'discord.js'

export class onMessageCreate extends DCEvent {
    async process(message: Message): Promise<void> {}
}
