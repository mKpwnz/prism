import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

// @TODO add docs for this file
// @TODO does this belong in the cars folder?

/**
 * @description
 * @author mKpwnz
 * @date 27.12.2023
 * @export
 * @class RestartDropbox
 * @extends {Command}
 */
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
        const response = await RconClient.sendCommand('ensure immo_store');
        LogManager.log(response);

        await this.replyWithEmbed({
            interaction,
            title: 'Dropbox neugestartet',
            description: 'Dropbox wurde neugestartet.',
        });
    }
}
