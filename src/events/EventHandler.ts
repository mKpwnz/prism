import { TransferVehicle } from '@commands/cars/TransferVehicle';
import { CustomImageUpload } from '@features/phone/CustomImageUpload';
import CommandManager from '@manager/CommandManager';
import { Client, Events, Interaction, Message } from 'discord.js';
import { OnMessageCreate } from './OnMessageCreate';
import { OnReady } from './OnReady';

export class EventHandler {
    static init(client: Client) {
        client.on(Events.ClientReady, async () => this.onReady(client));
        client.on(Events.MessageCreate, async (message) => this.onMessageCreate(message));
        client.on(Events.InteractionCreate, async (interaction) =>
            this.onInteractionCreate(interaction),
        );

        new CustomImageUpload(client);
    }

    private static onReady(client: Client) {
        new OnReady().process(client);
    }

    private static onInteractionCreate(interaction: Interaction) {
        CommandManager.onInteraction(interaction);
        TransferVehicle.autocomplete(interaction);
    }

    private static onMessageCreate(message: Message) {
        new OnMessageCreate().process(message);
    }
}
