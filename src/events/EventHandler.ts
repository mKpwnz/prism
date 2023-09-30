import { Client, Interaction, Message } from 'discord.js'
import { onReady } from './onReady'
import { onMessageCreate } from './onMessageCreate'
import { CommandHandler } from '@commands/CommandHandler'

/**
 * @description Handles all events
 * @author mKpwnz
 * @date 30.09.2023
 * @export
 * @class EventHandler
 */
export class EventHandler {
    static init(client: Client) {
        client.on('ready', async () => await this.onReady(client))
        client.on('messageCreate', async (message) => this.onMessageCreate(message))
        client.on('interactionCreate', async (interaction) => this.onInteractionCreate(interaction))
    }

    private static onReady(client: Client) {
        new onReady().process(client)
    }
    private static onInteractionCreate(interaction: Interaction) {
        CommandHandler.onInteraction(interaction)
    }
    private static onMessageCreate(message: Message) {
        new onMessageCreate().process(message)
    }
}
