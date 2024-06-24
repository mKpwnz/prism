import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RconClient } from '@prism/class/RconClient';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kickt einen Spieler')
        .addIntegerOption((option) =>
            option.setName('id').setDescription('ID des Spielers').setRequired(true),
        )
        .addStringOption((option) => option.setName('grund').setDescription('Grund des Kicks')),
)
export class Kick extends Command {
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
            Config.Groups.PROD.IC_HADMIN,
            Config.Groups.PROD.IC_ADMIN,
            Config.Groups.PROD.IC_MOD,

            Config.Groups.PROD.BOT_DEV,
        ];
        this.IsBetaCommand = true;
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
