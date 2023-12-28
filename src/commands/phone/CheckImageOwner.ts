import Config from '@Config';
import { Command } from '@class/Command';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { PhoneService } from '@services/PhoneService';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

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
            await this.replyWithEmbed({
                interaction,
                title: 'Image Owner',
                description: `Der link konnte nicht validiert werden.`,
                ephemeral: true,
            });
            return;
        }

        const phoneOwner = await PhoneService.getPhoneOwnerByImageLink(normalizedLink);

        if (!phoneOwner) {
            await this.replyWithEmbed({
                interaction,
                title: 'Image Owner',
                description: `Es konnte kein Spieler mit diesem Bild gefunden werden.`,
                ephemeral: true,
            });
            return;
        }

        await this.replyWithEmbed({
            interaction,
            title: 'Image Owner',
            description: `\`\`\`json\n${JSON.stringify(phoneOwner, null, 4)}\`\`\``,
        });
    }
}
