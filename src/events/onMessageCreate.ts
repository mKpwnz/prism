import { DCEvent } from '@class/DCEvent'
import { Message } from 'discord.js'

/**
 * @description
 * @author mKpwnz
 * @date 19.10.2023
 * @export
 * @class onMessageCreate
 * @extends {DCEvent}
 */
export class onMessageCreate extends DCEvent {
    async process(message: Message): Promise<void> {}
}
