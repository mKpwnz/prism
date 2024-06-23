import { BotClient } from '@prism/Bot';
import Config from '@prism/Config';
import { EENV } from '@prism/enums/EENV';
import { ICmdPrintInformation } from '@prism/interfaces/ICmdPrintInformation';
import { ICmdPrintInformationOption } from '@prism/interfaces/ICmdPrintInformationOption';
import CommandManager from '@prism/manager/CommandManager';
import { ChannelType } from 'discord.js';

interface IGroup {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
}

export interface IGroupV2Response {
    [key: string]: {
        intid: string;
        servername: string;
        groups: IGroup[];
    };
}

interface IChannel {
    id: string;
    name: string;
    position: number;
}

interface ICategory {
    name: string;
    position: number;
    channel: IChannel[];
}

export interface IChannelV2Response {
    [key: string]: {
        intid: string;
        servername: string;
        categories: ICategory[];
    };
}

export class HelpService {
    public static getCommands(): ICmdPrintInformation[] {
        const CmdPrintInformation: ICmdPrintInformation[] = [];
        CommandManager.getCommands().forEach((cmd) => {
            const cmdOptions: ICmdPrintInformationOption[] = [];
            const subCommands: ICmdPrintInformation[] = [];
            cmd.scb.options?.forEach((opt) => {
                const json = JSON.parse(JSON.stringify(opt));
                if (json.type === 1) {
                    subCommands.push({
                        commandName: json.name,
                        description: json.description,
                        production: json.required ?? false,
                        commandOptions: json.options,
                        isBeta: cmd.cmd.IsBetaCommand,
                    });
                } else if (json.type === 2) {
                    const subsubCommands: ICmdPrintInformation[] = [];
                    json.options.forEach((opt2: any) => {
                        subsubCommands.push({
                            commandName: opt2.name,
                            description: opt2.description,
                            production: opt2.required ?? false,
                            commandOptions: opt2.options,
                            isBeta: cmd.cmd.IsBetaCommand,
                        });
                    });
                    subCommands.push({
                        commandName: json.name,
                        description: json.description,
                        production: json.required ?? false,
                        subCommands: subsubCommands,
                        commandOptions: [],
                        isBeta: cmd.cmd.IsBetaCommand,
                    });
                } else {
                    cmdOptions.push({
                        name: json.name,
                        description: json.description,
                        required: json.required ?? false,
                        choices: json.choices,
                    });
                }
            });

            CmdPrintInformation.push({
                commandName: cmd.scb.name,
                description: cmd.scb.description,
                production: cmd.cmd.RunEnvironment === EENV.PRODUCTION,
                commandOptions: cmdOptions ?? [],
                subCommands,
                allowedChannels: cmd.cmd.AllowedChannels,
                allowedGroups: cmd.cmd.AllowedGroups,
                isBeta: cmd.cmd.IsBetaCommand,
            });
        });
        return CmdPrintInformation;
    }

    public static async getGroups(): Promise<Map<string, string>> {
        const res = new Map<string, string>();

        const roles = await BotClient.guilds.cache.get(Config.Servers.IMMO_LOGS)?.roles.cache;
        if (!roles) return res;
        for (const [key, value] of roles.entries()) {
            res.set(key, value.name);
        }
        return res;
    }

    public static async getGroupsV2(): Promise<IGroupV2Response> {
        const res: IGroupV2Response = {};

        for (const [key, value] of Object.entries(Config.Servers)) {
            const guild = BotClient.guilds.cache.get(value);
            if (guild) {
                const roles = guild.roles.cache;
                const servername = guild.name;
                res[key] = {
                    intid: value,
                    servername,
                    groups: [],
                };
                for (const [key2, value2] of roles.entries()) {
                    const colorString =
                        value2.color.toString(16) === '0' ? null : value2.color.toString(16);
                    res[key].groups.push({
                        id: key2,
                        name: value2.name,
                        icon: value2.icon,
                        color: colorString,
                    });
                }
            }
        }

        return res;
    }

    public static async getChannelV2(): Promise<IChannelV2Response> {
        const res: IChannelV2Response = {};

        for (const [key, value] of Object.entries(Config.Servers)) {
            const guild = BotClient.guilds.cache.get(value);
            if (guild) {
                const channels = guild.channels.cache;
                const servername = guild.name;
                const categories: ICategory[] = [
                    {
                        position: 0,
                        name: 'Uncategorized',
                        channel: [],
                    },
                ];
                for (const [key2, value2] of channels.entries()) {
                    if (value2.type === ChannelType.GuildText) {
                        if (!value2.parent) {
                            categories[0].channel.push({
                                id: key2,
                                name: value2.name,
                                position: value2.position,
                            });
                        } else {
                            let category = categories.find((c) => c.name === value2.parent?.name);
                            if (!category) {
                                category = {
                                    name: value2.parent.name,
                                    position: value2.parent.position,
                                    channel: [],
                                };
                            }
                            category.channel.push({
                                id: key2,
                                name: value2.name,
                                position: value2.position,
                            });

                            if (!categories.find((c) => c.name === category.name)) {
                                categories.push(category);
                            }
                        }
                    }
                }
                categories.sort((a, b) => a.position - b.position);
                categories.forEach((category) => {
                    category.channel.sort((a, b) => a.position - b.position);
                });

                res[key] = {
                    intid: value,
                    servername,
                    categories,
                };
            }
        }

        return res;
    }

    public static async getChannel(): Promise<Map<string, string>> {
        const channel = new Map<string, string>();
        const channelApiResponse = await BotClient.guilds.cache.get(Config.Servers.IMMO_LOGS)
            ?.channels.cache;
        if (!channelApiResponse) return channel;
        for (const [key, value] of channelApiResponse.entries()) {
            channel.set(key, value.name);
        }
        return channel;
    }
}
