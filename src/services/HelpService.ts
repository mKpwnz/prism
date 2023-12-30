import { BotClient } from '@Bot';
import Config from '@Config';
import { CommandHandler } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ICmdPrintInformation } from '@interfaces/ICmdPrintInformation';
import { ICmdPrintInformationOption } from '@interfaces/ICmdPrintInformationOption';

export class HelpService {
    public static getCommands(): ICmdPrintInformation[] {
        const CmdPrintInformation: ICmdPrintInformation[] = [];
        CommandHandler.commands.forEach((cmd) => {
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

        const roles = await BotClient.guilds.cache.get(Config.Discord.ServerID)?.roles.cache;
        if (!roles) return res;
        for (const [key, value] of roles.entries()) {
            res.set(key, value.name);
        }
        return res;
    }

    public static async getChannel(): Promise<Map<string, string>> {
        const channel = new Map<string, string>();
        const channelApiResponse = await BotClient.guilds.cache.get(Config.Discord.ServerID)
            ?.channels.cache;
        if (!channelApiResponse) return channel;
        for (const [key, value] of channelApiResponse.entries()) {
            channel.set(key, value.name);
        }
        return channel;
    }
}
