import { Config } from '@Config';
import { DCEvent } from '@class/DCEvent';
import { RconClient } from '@class/RconClient';
import { CommandHandler } from '@commands/CommandHandler';
import { EmoteManager } from '@manager/EmoteManager';
import LogManager from '@utils/Logger';
import { Client, REST, Routes } from 'discord.js';

export class OnReady extends DCEvent {
    async process(client: Client) {
        const rest = new REST({ version: '9' }).setToken(Config.ENV.DISCORD_TOKEN);
        CommandHandler.initAll(client);
        new RconClient();
        const commandData = CommandHandler.commands.map((command) => command.scb.toJSON());
        Config.Bot.ServerID.forEach(async (id) => {
            try {
                LogManager.info(`Registering commands on Server ${id}`);
                await rest.put(
                    Routes.applicationGuildCommands(client.user?.id ?? 'missing id', id),
                    {
                        body: commandData,
                    },
                );
                LogManager.info(`Registering commands on Server ${id} done!`);
            } catch (error) {
                LogManager.error(error);
            }
        });
        Config.Bot.ServerID.forEach(async (id) => {
            await EmoteManager.updateBotEmotes(client, id);
        });

        LogManager.info('Discord ready!');
    }
}
