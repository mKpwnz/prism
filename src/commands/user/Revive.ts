import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RconClient } from '@prism/class/RconClient';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('revive')
        .setDescription('Revive einen Spieler')
        .addIntegerOption((option) =>
            option.setName('id').setDescription('ID des Spielers').setRequired(true),
        )
        .addBooleanOption((option) =>
            option.setName('kampfunfähig').setDescription('Kampfunfähigkeit hinzufügen?'),
        ),
)
export class Revive extends Command {
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
