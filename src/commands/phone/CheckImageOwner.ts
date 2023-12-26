import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import Config from '@proot/Config';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandHelper } from '@commands/CommandHelper';
import { GameDbService } from '@proot/services/GameDb.service';

// TODO: REFACTOR
export class CheckImageOwner extends Command {
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
            new SlashCommandBuilder()
                .setName('pcheckimageowner')
                .setDescription('Check who created an Ingame image')
                .addStringOption((option) =>
                    option.setName('imageurl').setDescription('Image URL').setRequired(true),
                ),
            this,
        );
    }

    normalizeLink(link: string): string | null {
        const match = link.match(/\/(\d+\/\d+\/[^/?]+)(?:\?.*)?$/);
        if (match) {
            return match[1];
        }
        return null;
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            // We should have a better solution for input validation
            const nLink = this.normalizeLink(
                interaction.options.get('imageurl')?.value?.toString() as string,
            );
            if (!nLink) {
                await interaction.reply({
                    content: `Der link konnte nicht validiert werden.`,
                    ephemeral: true,
                });
                return;
            }
            // @TODO why?
            LogManager.debug(nLink);

            const phoneOwner = await GameDbService.getPhoneOwnerByImageLink(nLink);

            await interaction.reply({
                content: `\`\`\`json\n${JSON.stringify(phoneOwner, null, 4)}\`\`\``,
            });
        } catch (error) {
            await CommandHelper.handleInteractionError(error, interaction);
        }
    }
}
