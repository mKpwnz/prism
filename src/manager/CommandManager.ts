import Command from '@prism/class/Command';
import { EENV } from '@prism/enums/EENV';
import { Client, Events, REST, Routes } from 'discord.js';

import '@prism/commands';

import { BotClient, SentryClient } from '@prism/Bot';
import Config from '@prism/Config';
import { RegisterEvent } from '@prism/decorators';
import { CommandRegistry } from '@prism/decorators/RegisterCommand';
import BotCommandNotValidError from '@prism/error/BotCommandNotValid.error';
import { ArgsOf, PrismSCB } from '@prism/types/PrismTypes';
import LogManager from './LogManager';

export default class CommandManager {
    private static commands: { cmd: Command; scb: PrismSCB }[] = [];

    private static prodCommands: string[] = [];

    private static devCommands: string[] = [];

    public static getCommands() {
        return this.commands;
    }

    public static loadCommands(client: Client) {
        for (const entrie of CommandRegistry) {
            const { scb, Cmd } = entrie;
            if (!(Cmd.prototype instanceof Command)) {
                throw new BotCommandNotValidError('Command is not valid. It must extend Command.');
            }
            const command = new Cmd(client);
            this.register(scb, command);
        }
        LogManager.debug(`Initialized ${this.commands.length} Commands in CommandManager`);
        const rest = new REST({ version: '9' }).setToken(Config.ENV.DISCORD_TOKEN);
        const commandData = this.getCommands().map((command) => command.scb.toJSON());
        Config.Bot.ServerID.forEach(async (id) => {
            try {
                LogManager.info(`Registering commands on Server ${id}`);
                await rest.put(
                    Routes.applicationGuildCommands(BotClient.user?.id ?? 'missing id', id),
                    {
                        body: commandData,
                    },
                );
                LogManager.info(`Registering commands on Server ${id} done!`);
            } catch (error) {
                SentryClient.captureException(error);
                LogManager.error(error);
            }
        });
    }

    private static register(scb: PrismSCB, cmd: Command) {
        if (cmd.RunEnvironment === EENV.PRODUCTION) CommandManager.prodCommands.push(scb.name);
        if (cmd.RunEnvironment === EENV.DEVELOPMENT) CommandManager.devCommands.push(scb.name);
        CommandManager.commands.push({
            cmd,
            scb,
        });
    }

    @RegisterEvent(Events.InteractionCreate)
    async onInteraction([interaction]: ArgsOf<Events.InteractionCreate>) {
        if (!interaction.isChatInputCommand()) return;
        for (const command of CommandManager.commands) {
            if (command.scb.name === interaction.commandName) {
                await command.cmd.run(interaction);
            }
        }
    }
}
