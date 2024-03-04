import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { PlayerService } from '@prism/services/PlayerService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('isonline')
        .setDescription('Ist ein Spieler online?')
        .addStringOption((option) =>
            option.setName('spieler').setDescription('SteamID des Spielers').setRequired(true),
        ),
)
export class IsOnline extends Command {
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

            Config.Groups.DEV.BOTTEST,
            Config.Groups.PROD.BOT_DEV,
        ];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const player = interaction.options.getString('spieler', true) ?? '';

        if (player === '') {
            await interaction.reply({
                content: `Bitte gib eine SteamID an!`,
                ephemeral: true,
            });
            return;
        }

        const vUser = await PlayerService.validatePlayer(player);
        if (!vUser) {
            await interaction.reply({
                content: `Es konnte kein User mit der SteamID \`${player}\` gefunden werden!`,
                ephemeral: true,
            });
            return;
        }

        await this.replyWithEmbed({
            title: vUser.metadata.isPlayerOnline
                ? `Spieler ist online ${
                      vUser.metadata.currentID !== -1 ? `| ID: ${vUser.metadata.currentID}` : ''
                  }`
                : 'Spieler ist offline',
            description: `Name: ${vUser.playerdata.fullname}\nTX-Admin: ${vUser.steamnames.current}`,
        });
    }
}
