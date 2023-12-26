import { Command } from '@class/Command';
import { RconClient } from '@class/RconClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';

import Config from '@proot/Config';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHelper } from '@commands/CommandHelper';

export class NvhxBan extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI];
        this.AllowedGroups = [
            Config.Discord.Groups.DEV_SERVERENGINEER,
            Config.Discord.Groups.DEV_BOTTESTER,
            Config.Discord.Groups.IC_SUPERADMIN,
        ];
        this.AllowedUsers = [Config.Discord.Users.List.MIKA];
        this.IsBetaCommand = true;
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('nvhxban')
                .setDescription('Bannt einen Nutzer')
                .addIntegerOption((option) =>
                    option.setName('id').setDescription('SpielerID').setRequired(true),
                ),
            this,
        );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { options } = interaction;
        const embed = this.getEmbedTemplate(interaction);
        try {
            const id = options.getInteger('id', true);
            // @TODO should we check if id was provided? Otherwise an error will be thrown.

            const response = await NvhxBan.banPlayerById(id);

            if (response.includes('Banned: ')) {
                embed.setTitle('Neverhax Ban');
                embed.setDescription(
                    `Bannt SpielerID ${id}\nAntwort vom Server:\n\`\`\`${response}\`\`\``,
                );
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ content: 'Spieler nicht gefunden!', ephemeral: true });
            }
        } catch (error) {
            await CommandHelper.handleInteractionError(error, interaction);
        }
    }

    // @TODO move to another place that makes sense
    // @TODO improve return value
    private static async banPlayerById(playerId: number): Promise<string> {
        let response = await RconClient.sendCommand(`nvhx ban ${playerId}`);
        response = response.replace('print ', '');
        response = response.substring(4);
        // response = response.replace('<-- NEVERHAX NVHX -->', '')
        response = response.replace(
            'Violation: Banned by **CONSOLE**',
            'Violation: Banned by **CONSOLE**\n',
        );

        return response;
    }
}
