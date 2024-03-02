import Command from '@class/Command';
import BotCommandNotValidError from '@error/BotCommandNotValid.error';
import { TcustomSCB } from '@manager/CommandManager';

export const CommandClassRegistry: { scb: TcustomSCB; Cmd: any }[] = [];

export function RegisterCommand(scb: TcustomSCB) {
    return function exec(Cmd: any) {
        if (!(Cmd.prototype instanceof Command)) {
            throw new BotCommandNotValidError('Command is not valid. It must extend Command.');
        }
        CommandClassRegistry.push({ scb, Cmd });
        return Cmd;
    };
}

