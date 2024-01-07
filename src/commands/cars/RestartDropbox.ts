import Config from '@Config';
import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

/**
 * @description Klasse zum Neustarten der Ingame Dropbox (Import Garage für neue Fahrzeuge aus dem Tebex Store).
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
            Config.Channels.PROD.WHOIS_TEBEX,
            Config.Channels.PROD.WHOIS_TESTI,

            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,

            Config.Groups.DEV.BOTTEST,
        ];
        this.AllowedUsers = [Config.Users.SCHLAUCHI];
        this.IsBetaCommand = true;
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('restartdropbox')
                .setDescription('Startet die Tebexausgabe neu'),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await RconClient.sendCommand('ensure immo_store');
        await this.replyWithEmbed({
            interaction,
            title: 'Dropbox neugestartet',
            description: 'Dropbox wurde neugestartet.',
        });
    }
}
