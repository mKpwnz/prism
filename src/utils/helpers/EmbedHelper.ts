import { IEmbedOptions } from '@interfaces/IEmbed';
import { EmbedBuilder } from 'discord.js';
import { EEmbedColors } from '@enums/EmbedColors';
import Config from '@Config';
import LogManager from '@utils/Logger';
import { BotClient } from '@Bot';

export function getEmbedBase(opt: IEmbedOptions): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle(opt.title ?? ' ')
        .setDescription(opt.description)
        .setColor(opt.color ?? EEmbedColors.DEFAULT)
        .setAuthor({
            name: Config.Bot.BOT_NAME,
            iconURL: Config.Bot.BOT_LOGO,
        })
        .setTimestamp(new Date())
        .setFields(opt.fields ?? [])
        .setImage(opt.customImage ?? Config.Bot.WHITESPACE);
}

export async function sendToChannel(embed: EmbedBuilder, logChannel: string) {
    const channel = await BotClient.channels.fetch(
        process.env.NODE_ENV === 'production' ? logChannel : Config.Channels.DEV.PRISM_TEST_LOG,
    );
    if (channel?.isTextBased()) {
        await channel.send({ embeds: [embed] });
    } else {
        LogManager.error(`Tried to log to channel ${logChannel} which was not found!`);
    }
}
