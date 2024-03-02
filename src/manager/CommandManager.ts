import Command from '@class/Command';
import { EENV } from '@enums/EENV';
import { Interaction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

import '@commands';
import BotCommandNotValidError from '@error/BotCommandNotValid.error';
import { CommandClassRegistry } from '@decorators/RegisterCommand';
import LogManager from './LogManager';

export type TcustomSCB =
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

export default class CommandManager {
    private static commands: { cmd: Command; scb: TcustomSCB }[] = [];

    private static prodCommands: string[] = [];

    private static devCommands: string[] = [];

    public static getCommands() {
        return this.commands;
    }

    public static loadCommands() {
        for (const entrie of CommandClassRegistry) {
            const { scb, Cmd } = entrie;
            if (!(Cmd.prototype instanceof Command)) {
                throw new BotCommandNotValidError('Command is not valid. It must extend Command.');
            }
            const command = new Cmd();
            this.init(scb, command);
        }
    }

    public static init(scb: TcustomSCB, cmd: Command) {
        LogManager.debug(`INIT: ${scb.name}`);
        if (cmd.RunEnvironment === EENV.PRODUCTION) CommandManager.prodCommands.push(scb.name);
        if (cmd.RunEnvironment === EENV.DEVELOPMENT) CommandManager.devCommands.push(scb.name);
        CommandManager.commands.push({
            cmd,
            scb,
        });
    }

    public static async onInteraction(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;
        for (const command of CommandManager.commands) {
            if (command.scb.name === interaction.commandName) {
                await command.cmd.run(interaction);
            }
        }
    }
}

