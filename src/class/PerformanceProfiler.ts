import Config from '@Config';
import { EEmbedColors } from '@enums/EmbedColors';
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3';
import { ChatInputCommandInteraction } from 'discord.js';
import { getEmbedBase } from '@utils/helpers/EmbedHelper';

export class PerformanceProfiler {
    private profilerName: string;

    ProfilerData: { profilerStep: string; timestamp: number }[];

    constructor(profilerName: string) {
        this.profilerName = profilerName;
        this.ProfilerData = [];
        this.ProfilerData.push({ profilerStep: 'Profiler Start', timestamp: new Date().getTime() });
    }

    addStep(profilerStep: string) {
        this.ProfilerData.push({ profilerStep, timestamp: new Date().getTime() });
    }

    async sendEmbed(interaction: ChatInputCommandInteraction) {
        if (interaction.channel?.id !== Config.Channels.DEV.PRISM_TESTING) return;

        this.ProfilerData.push({ profilerStep: 'Profiler End', timestamp: new Date().getTime() });
        const table = new AsciiTable3('Performance Profiler')
            .setStyle('unicode-single')
            .setHeading('Step Name', 'Δ TSS', 'Δ TPS')
            .setAlign(1, AlignmentEnum.LEFT)
            .setAlign(2, AlignmentEnum.RIGHT)
            .setAlign(3, AlignmentEnum.RIGHT);

        this.ProfilerData.forEach((d, i) => {
            table.addRow(
                d.profilerStep,
                i === 0 ? 0 : d.timestamp - this.ProfilerData[0].timestamp,
                i === 0 ? 0 : d.timestamp - this.ProfilerData[i - 1].timestamp,
            );
        });

        const embed = getEmbedBase({
            title: `Performance Profiler: ${this.profilerName}`,
            description: `\`\`\`\n${table.toString()}\`\`\``,
            color: EEmbedColors.DEBUG,
        }).setFooter({
            text: `${interaction.user.displayName ?? ''}`,
            iconURL: interaction.user.avatarURL() ?? '',
        });

        await interaction.channel?.send({ embeds: [embed] });
    }
}
