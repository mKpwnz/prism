import { EEmbedColors } from '@enums/EmbedColors';
import Config from '@Config';
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3';
import { caching, MemoryCache, MemoryStore } from 'cache-manager';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import * as prettier from 'prettier';

/**
 * @description Cache Klasse für den MemCache. (https://www.npmjs.com/package/cache-manager)
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @class Cache
 */
export class Cache {
    private static mc: MemoryCache;

    /**
     * @description Initialisiert den Cache
     * @author mKpwnz
     * @date 14.10.2023
     * @static
     * @returns {*}  {Promise<void>}
     * @memberof Cache
     */
    public static async init(): Promise<void> {
        Cache.mc = await caching('memory', {
            max: 100,
            ttl: 60 * 60 * 1000,
        });
    }

    /**
     * @description Setzt einen Wert in den Cache.  (TTL in Millisekunden) (Standard TTL: 60 Minuten)
     * @author mKpwnz
     * @date 14.10.2023
     * @static
     * @param {string} key
     * @param {*} value
     * @param {number} [ttl]
     * @returns {*}  {Promise<void>}
     * @memberof Cache
     */
    public static async set(key: string, value: any, ttl?: number): Promise<void> {
        if (!Cache.mc) await Cache.init();
        await Cache.mc.set(key, value, ttl);
    }

    /**
     * @description Gibt den Wert des Caches zurück, wenn vorhanden. Ansonsten undefined.
     * @author mKpwnz
     * @date 14.10.2023
     * @static
     * @template T
     * @param {string} key
     * @returns {*}  {(Promise<T | undefined>)}
     * @memberof Cache
     */
    public static async get<T>(key: string): Promise<T | undefined> {
        if (!Cache.mc) await Cache.init();
        return (await Cache.mc.get(key)) as T;
    }

    /**
     * @description Löscht einen Wert aus dem Cache, wenn vorhanden. Ansonsten passiert nichts.
     * @author mKpwnz
     * @date 14.10.2023
     * @static
     * @param {string} key
     * @returns {*}  {Promise<void>}
     * @memberof Cache
     */
    public static async delete(key: string): Promise<void> {
        if (!Cache.mc) await Cache.init();
        await Cache.mc.del(key);
    }

    /**
     * @description Löscht den gesamten Cache. ACHTUNG: Dieser Befehl sollte nur im Notfall verwendet werden, da er den gesamten Cache leert.
     * @author mKpwnz
     * @date 14.10.2023
     * @static
     * @returns {*}  {Promise<void>}
     * @memberof Cache
     */
    public static async reset(): Promise<void> {
        if (!Cache.mc) await Cache.init();
        await Cache.mc.reset();
    }

    /**
     * @description Gibt den gesamten Cache zurück. ACHTUNG: Dieser Befehl sollte nur im Notfall verwendet werden, da er den gesamten Cache zurückgibt.
     * @author mKpwnz
     * @date 14.10.2023
     * @static
     * @returns {*}  {Promise<MemoryStore>}
     * @memberof Cache
     */
    public static async getStore(): Promise<MemoryStore> {
        if (!Cache.mc) await Cache.init();
        return Cache.mc.store;
    }

    /**
     * @description Führt einen Performance Test durch und gibt die Ergebnisse in einem Embed zurück.
     * @author mKpwnz
     * @date 14.10.2023
     * @static
     * @param {ChatInputCommandInteraction} interaction
     * @param {Function} callback
     * @param {string} [cachingKey]
     * @returns {*}  {Promise<void>}
     * @memberof Cache
     */
    public static async testPerformance(
        interaction: ChatInputCommandInteraction,
        callback: Function,
        cachingKey?: string,
    ): Promise<void> {
        const embed = new EmbedBuilder()
            .setColor(EEmbedColors.DEFAULT)
            .setTimestamp()
            .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
            .setFooter({
                text: interaction.user.displayName ?? '',
                iconURL: interaction.user.avatarURL() ?? '',
            })
            .setTimestamp(new Date())
            .setImage(Config.Pictures.WHITESPACE);
        embed.setTitle('Cache Performance Test');

        const cacheStore = await Cache.getStore();
        const keyStore = await cacheStore.keys();
        let isInCache = false;
        if (cachingKey && keyStore.includes(cachingKey)) isInCache = true;

        const start = new Date().getTime();
        await callback();
        const elapsed = new Date().getTime() - start;
        const formattedCode = await prettier.format(callback.toString(), {
            parser: 'typescript',
            tabWidth: 2,
        });
        const table = new AsciiTable3('Cache Performance')
            .setStyle('unicode-single')
            .setAlign(1, AlignmentEnum.LEFT)
            .setAlign(2, AlignmentEnum.RIGHT);
        table.addRow('Execution Time', elapsed);
        if (isInCache && cachingKey) {
            const ttl = await cacheStore.ttl(cachingKey);
            let ttlString = '';
            if (ttl) {
                let seconds = Math.floor(ttl / 1000);
                let minutes = Math.floor(seconds / 60);
                let hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                hours -= days * 24;
                minutes = minutes - days * 24 * 60 - hours * 60;
                seconds = seconds - days * 24 * 60 * 60 - hours * 60 * 60 - minutes * 60;
                ttlString = `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${
                    minutes > 0 ? `${minutes}m ` : ''
                }${seconds > 0 ? `${seconds}s` : ''}`;
            }

            table.addRow('Type', 'Cached with MemCache');
            table.addRow('CacheKey', cachingKey);
            table.addRow('TTL', ttlString);
        } else {
            table.addRow('Type', 'SQL Execute');
        }
        embed.setDescription(`\`\`\`js\n${formattedCode}\`\`\` \`\`\`\n${table.toString()}\`\`\``);
        await interaction.reply({ content: ``, embeds: [embed] });
    }
}
