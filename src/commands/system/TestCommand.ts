import Config from '@Config';
import { Command } from '@class/Command';
import { PerformanceProfiler } from '@class/PerformanceProfiler';
import GameserverClient from '@clients/GameserverClient';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export class TestCommand extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [Config.Channels.DEV.PRISM_TESTING];
        this.AllowedGroups = [Config.Groups.PROD.BOT_DEV, Config.Groups.DEV.BOTTEST];
        RegisterCommand(
            new SlashCommandBuilder().setName('testcommand').setDescription('Test Command'),
            this,
        );
        this.DoNotCountUse = true;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const profiler = new PerformanceProfiler('TestCommand');
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
        const gar = await GameserverClient.getAllGarages();
        console.log(gar);
        await this.replyWithEmbed({
            description: `test`,
        });
        await profiler.sendEmbed(interaction);
    }
}
