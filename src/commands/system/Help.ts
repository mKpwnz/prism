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
            Config.Discord.Channel.WHOIS_TESTI,
            Config.Discord.Channel.WHOIS_UNLIMITED,
        ];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
            Config.Discord.Groups.IC_HADMIN,
            Config.Discord.Groups.IC_ADMIN,
            Config.Discord.Groups.IC_MOD,
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
