import Config from '@prism/Config';
import { EEmbedColors } from '@prism/typings/enums/EmbedColors';
import LogManager from '@prism/manager/LogManager';
import { getEmbedBase } from '@prism/utils/DiscordHelper';
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3';
import { User } from 'discord.js';
import { BotClient } from '../Bot';

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

    reset() {
        this.ProfilerData = [];
        this.ProfilerData.push({ profilerStep: 'Profiler Start', timestamp: new Date().getTime() });
    }

    async sendEmbed(channelid: string, user: User) {
        if (![Config.Channels.DEV.TESTING, Config.Channels.STAGING.TESTING].includes(channelid))
            return;

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
            text: `${user.displayName ?? ''}`,
            iconURL: user.avatarURL() ?? Config.Bot.BOT_LOGO,
        });
        const channel = await BotClient.channels.fetch(channelid);
        if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
    }

    async sendToConsole() {
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
        LogManager.info(table.toString());
    }
}
