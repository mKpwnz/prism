import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RconClient } from '@prism/class/RconClient';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('restartdropbox')
        .setDescription('Startet die Tebexausgabe neu'),
)
export class RestartDropbox extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,
            Config.Groups.PROD.BOT_DEV,
        ];
        this.AllowedUsers = [Config.Users.SCHLAUCHI];
        this.IsBetaCommand = true;
    }

    async execute(): Promise<void> {
        await RconClient.sendCommand('ensure immo_store');
        await this.replyWithEmbed({
            title: 'Dropbox neugestartet',
            description: 'Dropbox wurde neugestartet.',
        });
    }
}

