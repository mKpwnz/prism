import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Help extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_UNLIMITED,
            Config.Channels.PROD.WHOIS_TESTI,

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
        RegisterCommand(
            new SlashCommandBuilder().setName('help').setDescription('Liste aller Befehle!'),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await this.replyWithEmbed({
            interaction,
            title: 'Bot Hilfe',
            description:
                'Die Hilfe findest du auf folgender Seite: [Bot Hilfe](https://brand.immortaldev.eu/discordbot)',
            ephemeral: true,
        });
    }
}
