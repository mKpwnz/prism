import { IEmbedOptions } from '@prism/interfaces/IEmbed';
import { AttachmentBuilder, CommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { EEmbedColors } from '@prism/enums/EmbedColors';
import Config, { envBasedVariable } from '@prism/Config';
import LogManager from '@prism/manager/LogManager';
import { BotClient } from '@prism/Bot';

export async function isUserAllowed(
    interaction: CommandInteraction,
    allowedChannels: string[] = [],
    allowedGroups: string[] = [],
    allowedUsers: string[] = [],
    blockedUsers: string[] = [],
): Promise<boolean> {
    const { channel, user, guild } = interaction;
    if (!guild) return false;

    const userRoleCache = guild.members.cache.get(user.id);
    let userIsAllowed = false;

    if (allowedUsers.length === 0) {
        userIsAllowed = true;
    } else if (allowedGroups.some((roleID) => userRoleCache?.roles.cache.has(roleID))) {
        userIsAllowed = true;
    } else if (allowedUsers.includes(user.id)) {
        userIsAllowed = true;
    }
    if (blockedUsers.includes(user.id)) {
        userIsAllowed = false;
    }
    if (Config.Bot.GlobalBlockedUsers.includes(user.id)) {
        userIsAllowed = false;
    }
    if (Config.Bot.GlobalWhitelistUsers.includes(user.id)) {
        userIsAllowed = true;
    }

    if (channel instanceof TextChannel) {
        if (allowedChannels.length > 0 && !allowedChannels.includes(channel.id)) {
            await interaction.reply({
                content: 'Dieser Command kann in diesem Channel nicht ausgeführt werden.',
                ephemeral: true,
            });
            return false;
        }
        if (!userIsAllowed) {
            await interaction.reply({
                content: 'Du hast leider keine Berechtigungen für den Command',
                ephemeral: true,
            });
            return false;
        }
        return true;
    }
    await interaction.reply({
        content: 'Dieser Command kann in diesem Channel nicht ausgeführt werden.',
        ephemeral: true,
    });
    return false;
}

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
        envBasedVariable({
            production: logChannel,
            staging: Config.Channels.STAGING.TEST_LOG,
            development: Config.Channels.DEV.TEST_LOG,
        }),
    );
    if (channel?.isTextBased()) {
        await channel.send({ embeds: [embed] });
    } else {
        LogManager.error(`Tried to log to channel ${logChannel} which was not found!`);
    }
}

export function attachmentFromJson(jsonInput: string, filename: string): AttachmentBuilder {
    return new AttachmentBuilder(Buffer.from(jsonInput, 'utf-8'), {
        name: `PRISM_${filename}_${new Date().toLocaleString('de-DE')}.json`,
    });
}

// TODO use everywhere we build an attachment
export function attachmentFromObject(objInput: any, filename: string): AttachmentBuilder {
    return attachmentFromJson(JSON.stringify(objInput, null, 4), filename);
}

export function paginateApiResponse<T>(
    rawData: T[],
    compute: (ent: T) => string,
    pageSize: number,
): string[] {
    const pages = [];
    let currentPage = '';
    const response: string[] = [];

    for (const entrie of rawData) {
        response.push(compute(entrie));
    }

    for (const action of response) {
        // Überprüfe, ob die nächste Zeile hinzugefügt werden kann, ohne das Zeichenlimit zu überschreiten
        if (currentPage.length + action.length + 1 <= pageSize) {
            currentPage += `${action}\n`;
        } else {
            // Füge die aktuelle Seite zu den Seiten hinzu und beginne eine neue Seite
            pages.push(currentPage);
            currentPage = `${action}\n`;
        }
    }

    // Füge die letzte Seite hinzu, wenn vorhanden
    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    return pages;
}
