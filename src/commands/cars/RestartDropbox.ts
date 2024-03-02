import Config from '@Config';
import Command from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@decorators';
import { EENV } from '@enums/EENV';
import { SlashCommandBuilder } from 'discord.js';

<<<<<<< 335dae1077f2b35fcfc09014661255ef238761f8
@RegisterCommand(
    new SlashCommandBuilder()
        .setName('restartdropbox')
        .setDescription('Startet die Tebexausgabe neu'),
)
=======
>>>>>>> 071a1afc0885ae01e4c467a8c01e6abb9c851ce6
export class RestartDropbox extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,

            Config.Channels.PROD.PRISM_TESTING,
            Config.Channels.DEV.PRISM_TESTING,
        ];
        this.AllowedGroups = [
            Config.Groups.PROD.SERVERENGINEER,
            Config.Groups.PROD.IC_SUPERADMIN,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
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
