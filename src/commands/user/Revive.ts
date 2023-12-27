import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import Config from '@proot/Config';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Revive extends Command {
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
        this.IsBetaCommand = true;
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('revive')
                .setDescription('Suche nach Spielern')
                // add string option
                .setDMPermission(true)
                .addIntegerOption((option) =>
                    option.setName('id').setDescription('ID des Spielers').setRequired(true),
                )
                .addBooleanOption((option) =>
                    option.setName('kampfunfähig').setDescription('Kampfunfähigkeit hinzufügen?'),
                ),
            this,
        );
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const id = interaction.options.getInteger('id');
        const incapacitated = interaction.options.getBoolean('kampfunfähig') ?? false;

        let command = `revive ${id}`;
        if (incapacitated) command = `revive ${id} 1`;
        await RconClient.sendCommand(command);
        this.replyWithEmbed({
            interaction,
            title: 'Revive',
            description: `Der Spieler mit der ID **${id}** wurde revived!`,
        });
    }
}
