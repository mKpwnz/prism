import Command from '@prism/class/Command';
import { RconClient } from '@prism/class/RconClient';
import { EENV } from '@prism/enums/EENV';

import Config from '@prism/Config';
import { RegisterCommand } from '@prism/decorators';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('nvhxban')
        .setDescription('Bannt einen Nutzer')
        .addIntegerOption((option) =>
            option.setName('id').setDescription('SpielerID').setRequired(true),
        ),
)
export class NvhxBan extends Command {
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
        this.AllowedUsers = [Config.Users.MIKA];
        this.IsBetaCommand = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const id = interaction.options.getInteger('id', true);
        const response = await NvhxBan.banPlayerById(id);
        if (response.includes('Banned: ')) {
            await this.replyWithEmbed({
                title: 'Neverhax Ban',
                description: `Bannt SpielerID ${id}\nAntwort vom Server:\n\`\`\`${response}\`\`\``,
            });
        } else {
            await this.replyWithEmbed({
                title: 'Neverhax Ban',
                description: `Spieler nicht gefunden!`,
                ephemeral: true,
            });
        }
    }

    // @TODO move to another place that makes sense
    // @TODO improve return value
    // @TODO Move to NvhxService
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
