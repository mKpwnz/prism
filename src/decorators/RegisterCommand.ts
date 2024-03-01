import { Command } from '@class/Command';
import BotCommandNotValidError from '@error/BotCommandNotValid.error';
import { SlashCommandBuilder } from 'discord.js';

export const CommandClassRegistry: { scb: SlashCommandBuilder; Cmd: any }[] = [];

export function RegisterCommand(scb: SlashCommandBuilder) {
    return function exec(Cmd: any) {
        if (!(Cmd.prototype instanceof Command)) {
            throw new BotCommandNotValidError('Command is not valid. It must extend Command.');
        }
        CommandClassRegistry.push({ scb, Cmd });
        return Cmd;
    };
    // if (args[0].prototype instanceof Command) {
    //     const command = new ctx();
    // }
}

