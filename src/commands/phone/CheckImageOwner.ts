import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { PhoneService } from '@prism/services/PhoneService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('pcheckimageowner')
        .setDescription('Check who created an Ingame image')
        .addStringOption((option) =>
            option.setName('imageurl').setDescription('Image URL').setRequired(true),
        ),
)
export class CheckImageOwner extends Command {
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
    }

    private normalizeLink(link: string): string | null {
        const match = link.match(/\/(\d+\/\d+\/[^/?]+)(?:\?.*)?$/);
        if (match) {
            return match[1];
        }
        return null;
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const imageUrl: string = interaction.options.getString('imageurl', true);
        const normalizedLink = this.normalizeLink(imageUrl);

        if (!normalizedLink) {
            await this.replyError(`Der link konnte nicht validiert werden.`);
            return;
        }

        const phoneOwner = await PhoneService.getPhoneOwnerByImageLink(normalizedLink);

        if (!phoneOwner) {
            await this.replyWithEmbed({
                description: `Es konnte kein Spieler mit diesem Bild gefunden werden.`,
            });
            return;
        }

        await this.replyWithEmbed({
            description: `\`\`\`json\n${JSON.stringify(phoneOwner, null, 4)}\`\`\``,
        });
    }
}
