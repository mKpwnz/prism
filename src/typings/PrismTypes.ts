import {
    ClientEvents,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export type PrismSCB =
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

export type DiscordEvents = keyof ClientEvents;
export type ArgsOf<K extends keyof ClientEvents> = ClientEvents[K];

export type PrismEvent = {
    event: DiscordEvents;
    once: boolean;
    target: any;
    propertyKey: string;
    descriptor: PropertyDescriptor;
};
