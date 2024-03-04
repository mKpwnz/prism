import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { SlashCommandBuilder } from 'discord.js';

@RegisterCommand(new SlashCommandBuilder().setName('help').setDescription('Liste aller Befehle!'))
export class Help extends Command {
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
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.BOT_DEV,
            Config.Groups.DEV.BOTTEST,
        ];
    }

    async execute(): Promise<void> {
        await this.replyWithEmbed({
            title: 'Bot Hilfe',
            description:
                'Die Hilfe findest du auf folgender Seite: [Bot Hilfe](https://brand.immortaldev.eu/discordbot)',
            ephemeral: true,
        });
    }
}
