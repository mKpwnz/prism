import Config from '@prism/Config';
import Command from '@prism/class/Command';
import { PerformanceProfiler } from '@prism/class/PerformanceProfiler';
import { RegisterCommand } from '@prism/decorators';
import { EENV } from '@prism/enums/EENV';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

@RegisterCommand(new SlashCommandBuilder().setName('ping').setDescription('Pong!'))
export class Ping extends Command {
    constructor() {
        super();
        this.RunEnvironment = EENV.PRODUCTION;
        this.AllowedChannels = [
            Config.Channels.PROD.PRISM_BOT,
            Config.Channels.PROD.PRISM_HIGHTEAM,
            Config.Channels.PROD.PRISM_TESTING,
        ];
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const profiler = new PerformanceProfiler('ping');
        profiler.addStep('pre pong');
        await this.replyWithEmbed({ description: 'Pong!' });
        profiler.addStep('post pong');
        await profiler.sendEmbed(interaction.channel?.id ?? '', interaction.user);
    }
}
