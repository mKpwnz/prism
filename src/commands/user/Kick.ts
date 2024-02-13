import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import Config from '@Config';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class Kick extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.WHOIS_TESTI,
            Config.Channels.PROD.WHOIS_UNLIMITED,

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
        RegisterCommand(
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
        const { options } = interaction;
        const embed = Command.getEmbedTemplate(interaction);

        try {
            const id = options.getInteger('id');
            const grund = options.getString('grund') ?? 'Du wurdest vom Support gekickt!';
            let response = await RconClient.sendCommand(`kick ${id} "${grund}"`);
            response = response.replace('print ', '');
            response = response.substring(4);
            response = response.replace('^7', '');
            response = response.replace('^1', '');
            response = response.trim();
            if (response.includes('Disconnected')) {
                embed.setTitle('Kick Player');
                embed.setDescription(
                    `SpielerID ${id} gekickt\nAntwort vom Server:\n\`${response
                        .replace('print ', '')
                        .trim()}\``,
                );
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({
                    content: 'Spieler wurde nicht gefunden!',
                    ephemeral: true,
                });
            }
        } catch (error) {
            LogManager.error(error);
            await interaction.reply({
                content: `Probleme mit der Serverkommunikation:\`\`\`json${JSON.stringify(
                    error,
                )}\`\`\``,
                ephemeral: true,
            });
        }
    }
}
