import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { PerformanceProfiler } from '@prism/class/PerformanceProfiler';
import ActiveDirectoryClient from '@prism/clients/ActiveDirectoryClient';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(
    new SlashCommandBuilder()
        .setName('testcommand')
        .setDescription('Test Command')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('User to get information about')
                .setRequired(true),
        ),
)
export class TestCommand extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
        this.AllowedGroups = [Config.Groups.PROD.BOT_DEV, Config.Groups.DEV.BOTTEST];
        this.DoNotLog = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const optUser = interaction.options.getUser('user');
        if (!optUser) {
            await this.replyError('User not found');
            return;
        }

        const profiler = new PerformanceProfiler('TestCommand');
        const { searchEntries } = await ActiveDirectoryClient.search(
            'OU=Benutzer,DC=immortaldev,DC=eu',
            {
                scope: 'sub',
                filter: `(&(objectclass=person)(userDiscordId=${optUser.id}))`,
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
        // console.log(searchEntries[0].memberOf);

        // const livePlayer = await PlayerService.getPlayerById(1);
        // await this.ad.bind({
        //     user: process.env.ACTIVEDIRECTORY_USER || '',
        //     pass: process.env.ACTIVEDIRECTORY_PASS || '',
        // });
        // const result = await this.ad.query({
        //     base: 'OU=Benutzer,DC=immortaldev,DC=eu',
        //     options: {
        //         filter: `(&(objectclass=person)(userDiscordId=${interaction.user.id}))`,
        //         scope: 'sub',
        //         paged: true,
        //     },
        // });
        // const _attri: { [key: string]: string } = {};
        // const filterAttributes: string[] = [
        //     'cn',
        //     'distinguishedName',
        //     'sAMAccountName',
        //     'userPrincipalName',
        //     'mail',
        //     'userDiscordId',
        //     'userSteamId',
        // ];
        // result[0].attributes.forEach((attr) => {
        //     if (filterAttributes.includes(attr.type)) {
        //         _attri[attr.type] = attr.vals[0];
        //     }
        // });
        await this.replyWithEmbed({
            description: `**User: ${optUser.displayName}\n\n**Gruppen:\n${reponseList.join('\n')}`,
        });
        await profiler.sendEmbed(interaction.channelId, interaction.user);
    }
}
