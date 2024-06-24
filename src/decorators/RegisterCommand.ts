import Command from '@prism/class/Command';
import BotCommandNotValidError from '@prism/error/BotCommandNotValid.error';
import { PrismSCB } from '@prism/typings/PrismTypes';

export const CommandRegistry: { scb: PrismSCB; Cmd: any }[] = [];

export function RegisterCommand(scb: PrismSCB) {
    return function (Cmd: any) {
        if (!(Cmd.prototype instanceof Command)) {
            throw new BotCommandNotValidError('Command is not valid. It must extend Command.');
        }
        CommandRegistry.push({ scb, Cmd });
        return Cmd;
    };
}
