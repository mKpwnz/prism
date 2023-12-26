import { CommandHandler } from '@commands/CommandHandler';
import { CustomImageUpload } from '@features/phone/CustomImageUpload';
import { Client, Interaction, Message } from 'discord.js';
import { OnReady } from './OnReady';
import { OnMessageCreate } from './OnMessageCreate';

/**
 * @description Handles all events
 * @author mKpwnz
 * @date 30.09.2023
 * @export
 * @class EventHandler
 */
export class EventHandler {
    static init(client: Client) {
        client.on('ready', async () => this.onReady(client));
        client.on('messageCreate', async (message) => this.onMessageCreate(message));
        client.on('interactionCreate', async (interaction) => this.onInteractionCreate(interaction));

        new CustomImageUpload(client);
    }

    private static onReady(client: Client) {
        new OnReady().process(client);
    }

    private static onInteractionCreate(interaction: Interaction) {
        CommandHandler.onInteraction(interaction);
    }

    private static onMessageCreate(message: Message) {
        new OnMessageCreate().process(message);
    }
}
