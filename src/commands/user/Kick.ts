import Config from '@Config';
import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { initCommandOld } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Kick extends Command {
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
        this.IsBetaCommand = true;
        initCommandOld(
            new SlashCommandBuilder()
                .setName('kick')
                .setDescription('Kickt einen Spieler')
                .addIntegerOption((option) =>
                    option.setName('id').setDescription('ID des Spielers').setRequired(true),
                )
                .addStringOption((option) =>
                    option.setName('grund').setDescription('Grund des Kicks'),
                ),
            this,
        );
    }

    // await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true })
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const id = interaction.options.getInteger('id', true);
        const grund = interaction.options.getString('grund') ?? 'Du wurdest vom Support gekickt!';

        let response = await RconClient.sendCommand(`kick ${id} "${grund}"`);
        response = response.replace('print ', '');
        response = response.substring(4);
        response = response.replace('^7', '');
        response = response.replace('^1', '');
        response = response.trim();

        if (response.includes('Disconnected')) {
            await this.replyWithEmbed({
                description: `SpielerID ${id} gekickt\nAntwort vom Server:\n\`${response
                    .replace('print ', '')
                    .trim()}\``,
            });
        } else {
            await this.replyError('Spieler wurde nicht gefunden!');
        }
    }
}
