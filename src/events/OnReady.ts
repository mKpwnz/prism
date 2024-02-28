import { Config } from '@Config';
import { DCEvent } from '@class/DCEvent';
import { RconClient } from '@class/RconClient';
import { CommandHandler } from '@commands/CommandHandler';
import { REST } from '@discordjs/rest';
import { EmoteManager } from '@manager/EmoteManager';
import LogManager from '@utils/Logger';
import { Client, Routes } from 'discord.js';

export class OnReady extends DCEvent {
    async process(client: Client) {
        const rest = new REST({ version: '9' }).setToken(Config.ENV.DISCORD_TOKEN);
        CommandHandler.initAll(client);
        new RconClient();
        const commandData = CommandHandler.commands.map((command) => command.scb.toJSON());
        Config.Bot.ServerID.forEach(async (id) => {
            await rest.put(Routes.applicationGuildCommands(client.user?.id ?? 'missing id', id), {
                body: commandData,
            });
        });
        Config.Bot.ServerID.forEach(async (id) => {
            await EmoteManager.updateBotEmotes(client, id);
        });

        LogManager.info('Discord ready!');
    }
}
