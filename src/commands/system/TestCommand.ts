import Config from '@Config';
import { Command } from '@class/Command';
import { PerformanceProfiler } from '@class/PerformanceProfiler';
import { RegisterCommand } from '@commands/CommandHandler';
import { EENV } from '@enums/EENV';
import { UserService } from '@services/UserService';
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
        const schufaUsers = await UserService.getSchufaUsers();
        console.log(schufaUsers);
        await interaction.reply({ content: `Test` });
        await profiler.sendEmbed(interaction);
    }
}
