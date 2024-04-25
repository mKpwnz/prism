import Config from '@prism/Config';
import Command from '@prism/class/Command';
import ActiveDirectoryClient from '@prism/clients/ActiveDirectoryClient';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('activedirectory')
        .setDescription('Check Active Directory Information')
        .addSubcommand((subcommand) =>
            subcommand.setName('myperms').setDescription('Check your permissions'),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('userperms')
                .setDescription('Check user permissions')
                .addUserOption((option) =>
                    option
                        .setName('user')
                        .setDescription('User to get information about')
                        .setRequired(true),
                ),
        ),
)
export class ActiveDirectory extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.DEV.PRISM_TESTING,
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [Config.Groups.PROD.BOT_DEV, Config.Groups.DEV.BOTTEST];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        switch (interaction.options.getSubcommand()) {
            case 'myperms': {
                const { user } = interaction;
                const permissions = await this.getPermissionsFromUser(user.id);
                await this.replyWithEmbed({
                    description: `**User: ${interaction.user.displayName}\n\n**Gruppen:\n${permissions.join('\n')}`,
                });
                break;
            }
            case 'userperms': {
                const optUser = interaction.options.getUser('user');
                if (!optUser) {
                    await this.replyError('User not found');
                    return;
                }
                const permissions = await this.getPermissionsFromUser(optUser.id);
                await this.replyWithEmbed({
                    description: `**User: ${optUser.displayName}\n\n**Gruppen:\n${permissions.join('\n')}`,
                });
                break;
            }
            default: {
                await interaction.reply({ content: 'Command nicht gefunden.', ephemeral: true });
                break;
            }
        }
    }

    async getPermissionsFromUser(user: string): Promise<string[]> {
        const { searchEntries } = await ActiveDirectoryClient.search(
            'OU=Benutzer,DC=immortaldev,DC=eu',
            {
                scope: 'sub',
                filter: `(&(objectclass=person)(userDiscordId=${user}))`,
                attributes: [
                    'cn',
                    'distinguishedName',
                    'sAMAccountName',
                    'userPrincipalName',
                    'mail',
                    'userDiscordId',
                    'userSteamId',
                    'memberOf',
                ],
            },
        );
        const reponseList: string[] = [];
        if (Array.isArray(searchEntries[0].memberOf)) {
            searchEntries[0].memberOf.forEach((group) => {
                if (typeof group === 'string') reponseList.push(group.split(',')[0].split('=')[1]);
            });
        }
        return reponseList;
    }
}
