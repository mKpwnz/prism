import Config from '@Config';
import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Revive extends Command {
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
        initCommandOld(
            new SlashCommandBuilder()
                .setName('revive')
                .setDescription('Revive einen Spieler')
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

        await RconClient.sendCommand(`revive ${id}${incapacitated ? ' 1' : ''}`);
        await this.replyWithEmbed({
            title: 'Revive',
            description: `Der Spieler mit der ID **${id}** wurde revived!`,
        });
    }
}
