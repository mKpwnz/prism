import { DCEvent } from '@class/DCEvent';
import { Message } from 'discord.js';

/**
 * @description
 * @author mKpwnz
 * @date 19.10.2023
 * @export
 * @class onMessageCreate
 * @extends {DCEvent}
 */
export class OnMessageCreate extends DCEvent {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    async process(message: Message): Promise<void> {}
}
