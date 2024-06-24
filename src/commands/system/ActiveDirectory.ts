import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/typings/enums/EENV';
import { executeCommandFromMap } from '@prism/utils/DiscordCommandHelper';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import ActiveDirectoryClient from '@prism/clients/ActiveDirectoryClient';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('activedirectory')

        .setDescription('Check Active Directory Information')
        .addSubcommandGroup((subcommandGroup) =>
            subcommandGroup
                .setName('groups')
                .setDescription('Check groups from a user')
                .addSubcommand((subcommand) =>
                    subcommand.setName('me').setDescription('Check your permissions'),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('user')
                        .setDescription('Check user permissions')
                        .addUserOption((option) =>
                            option
                                .setName('user')
                                .setDescription('User to get information about')
                                .setRequired(true),
                        ),
                ),
        )
        .addSubcommandGroup((subcommandGroup) =>
            subcommandGroup
                .setName('profile')
                .setDescription('Check profile information')
                .addSubcommand((subcommand) =>
                    subcommand.setName('me').setDescription('Check your profile'),
                ),
        ),
)
export class ActiveDirectory extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [Config.Groups.PROD.BOT_DEV];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await executeCommandFromMap(interaction, {
            groups: {
                me: () => this.getMyGroups(interaction),
                user: () => this.getUserGroups(interaction),
            },
            profile: {
                me: () => this.getMyProfile(interaction),
            },
        });
    }

    private async getMyProfile(interaction: ChatInputCommandInteraction): Promise<void> {
        const { user } = interaction;
        const adUser = await ActiveDirectoryClient.getUserByDiscordId(user.id);
        if (adUser instanceof Error) {
            await this.replyError(adUser.message);
            return;
        }

        adUser.memberOf = [];
        adUser.memberOfpretty = [];

        await this.replyWithEmbed({
            description: `${JSON.stringify(adUser, null, 4)}`,
        });
    }

    private async getMyGroups(interaction: ChatInputCommandInteraction): Promise<void> {
        const { user } = interaction;
        const adUser = await ActiveDirectoryClient.getUserByDiscordId(user.id);
        if (adUser instanceof Error) {
            await this.replyError(adUser.message);
            return;
        }

        await this.replyWithEmbed({
            description: `**User: ${interaction.user.displayName}\n\n**Gruppen:\n${adUser.memberOfpretty.join('\n')}`,
        });
    }

    private async getUserGroups(interaction: ChatInputCommandInteraction): Promise<void> {
        const optUser = interaction.options.getUser('user');
        if (!optUser) {
            await this.replyError('User not found');
            return;
        }
        const adUser = await ActiveDirectoryClient.getUserByDiscordId(optUser.id);
        if (adUser instanceof Error) {
            await this.replyError(adUser.message);
            return;
        }
        await this.replyWithEmbed({
            description: `**User: ${optUser.displayName}\n\n**Gruppen:\n${adUser.memberOfpretty.join('\n')}`,
        });
    }
}
