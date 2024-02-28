import { BotClient } from '@Bot';
import Config from '@Config';
import { EENV } from '@enums/EENV';
import { Helper } from '@utils/Helper';
import LogManager from '@utils/Logger';
import { Client, Guild, GuildEmoji } from 'discord.js';

/**
 * TODO: We need to create a possibility to define a timeout for the promise
 *       Its not possible to cancel a promise in TS so we need a function to manage this.
 *       rn its working but its waiting for the timeout to finish
 *       maybe we need to create a Promise.race() with a timeout promise but this didnt work either cuz we need to cancel the other promise
 *       This is for the Functions deleteOldBotEmotes and createNewBotEmotes
 */

export class EmoteManager {
    private static Emotes: Map<string, Map<string, GuildEmoji>> = new Map();

    public static getEmote(name: string, serverid: string): GuildEmoji | null {
        return this.Emotes.get(serverid)?.get(name) ?? null;
    }

    static getAllBotEmotes() {
        return Config.Bot.Emotes;
    }

    static getEmoteByName(name: string) {
        return Config.Bot.Emotes.find((emote) => emote.name === name);
    }

    static async fetchEmoteFromAPI(
        emoteName: string,
        serverid: string,
    ): Promise<GuildEmoji | null> {
        const guild = BotClient.guilds.cache.get(serverid);
        if (!guild) return null;
        const emoteData = await guild.emojis.fetch();
        return emoteData.find((e) => e.name === emoteName) ?? null;
    }

    static async updateBotEmotes(client: Client, serverid: string): Promise<void> {
        LogManager.info('Cheking emotes...');
        if (Config.ENV.NODE_ENV === 'development') {
            await this.initEmotes();
            LogManager.info('Emotes Initialised!');
            return;
        }
        const guild = client.guilds.cache.get(serverid);
        if (!guild) {
            LogManager.error(`Guild not found!: ${serverid}`);
            return;
        }
        try {
            await this.deleteOldBotEmotes(guild);
            await this.createNewBotEmotes(guild);
            LogManager.info('Emotes checked!');
            await this.initEmotes();
            LogManager.info('Emotes Initialised!');
        } catch (error) {
            LogManager.error('Error while updating emotes!');
            LogManager.error(error);
        }
    }

    static async initEmotes(): Promise<void> {
        Config.Bot.ServerID.forEach(async (serverid) => {
            for (const emote of EmoteManager.getAllBotEmotes()) {
                const e = await EmoteManager.fetchEmoteFromAPI(emote.name, serverid);
                if (e && e.name) {
                    if (!this.Emotes.has(serverid)) {
                        this.Emotes.set(serverid, new Map());
                    }
                    this.Emotes.get(serverid)?.set(e.name, e);
                }
            }
        });
    }

    private static async deleteOldBotEmotes(guild: Guild, timeout: number = 5000): Promise<void> {
        let isTimeout = false;
        const timeoutPromise = Helper.promiseTimeout(timeout).then(() => {
            isTimeout = true;
        });
        for (const e of guild.emojis.cache.values()) {
            if (isTimeout) throw new Error('Timeout while deleting the old bot emotes!');
            if (e.name !== null && EmoteManager.getEmoteByName(e.name)) {
                await guild.emojis.delete(e);
                LogManager.info(`Deleted emote ${e.name} (${e.id})`);
            }
        }
        await timeoutPromise;
    }

    private static async createNewBotEmotes(guild: Guild, timeout: number = 5000): Promise<void> {
        let isTimeout = false;
        const timeoutPromise = Helper.promiseTimeout(timeout).then(() => {
            isTimeout = true;
        });
        for (const emote of EmoteManager.getAllBotEmotes()) {
            if (isTimeout) throw new Error('Timeout while adding the bot emotes!');
            const newEmote = await guild.emojis.create({
                name: emote.name,
                attachment: emote.link,
            });
            LogManager.info(`Added/Updated emote ${newEmote.name} (${newEmote.id})`);
        }
        await timeoutPromise;
    }
}
