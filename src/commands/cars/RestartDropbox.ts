import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import Config from '@proot/Config';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHelper } from '@commands/CommandHelper';

// @TODO add docs for this file
// @TODO does this belong in the cars folder?
export class RestartDropbox extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_TEBEX,
        ];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
        ];
        this.AllowedUsers = [Config.Discord.Users.List.SCHLAUCHI];
        this.IsBetaCommand = true;
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('restartdropbox')
                .setDescription('Startet die Tebexausgabe neu'),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const response = await RconClient.sendCommand('ensure immo_store');
            LogManager.log(response);

            await this.replyWithEmbed(
                interaction,
                `Dropbox neugestartet`,
                `Dropbox wurde neugestartet.`,
            );
        } catch (error) {
            // @TODO Error Handling does not work like that
            // @TODO If you want to catch this specific error, you should do it in RconClient.ts
            // @TODO A custom error type may be required
            await CommandHelper.handleInteractionError(error, interaction);
        }
    }
}
