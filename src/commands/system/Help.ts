import { Command } from '@class/Command';
import { CommandHandler, RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ICmdPrintInformation } from '@interfaces/ICmdPrintInformation';
import { ICmdPrintInformationOption } from '@interfaces/ICmdPrintInformationOption';
import { BotClient } from '@proot/Bot';
import Config from '@proot/Config';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Help extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI, Config.Discord.Channel.WHOIS_UNLIMITED];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
        ];
        RegisterCommand(new SlashCommandBuilder().setName('help').setDescription('Liste aller Befehle!'), this);
    }

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

            // if (cmd.cmd.RunEnvironment === EENV.PRODUCTION)
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

    public static async getGroups(): Promise<{ [key: string]: string }> {
        const res: { [key: string]: string } = {};
        const roles = await BotClient.guilds.cache.get(Config.Discord.ServerID)?.roles.cache;
        if (!roles) return res;
        for (const [key, value] of roles.entries()) {
            res[key] = value.name;
        }
        return res;
    }

    public static async getChannel(): Promise<{ [key: string]: string }> {
        const col: { [key: string]: string } = {};
        const channel = await BotClient.guilds.cache.get(Config.Discord.ServerID)?.channels.cache;
        if (!channel) return col;
        for (const [key, value] of channel.entries()) {
            col[key] = value.name;
        }
        return col;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({
            content: 'Die Hilfe findest du auf folgender Seite: [Bot Hilfe](https://brand.immortaldev.eu/discordbot)',
            ephemeral: true,
        });
    }
}
