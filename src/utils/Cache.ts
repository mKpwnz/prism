import { EmbedColors } from '@enums/EmbedColors'
import Config from '@proot/Config'
import { MemoryCache, MemoryStore, caching } from 'cache-manager'
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import LogManager from './Logger'
import * as ts from 'typescript'
import * as prettier from 'prettier'
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3'

export class Cache {
    private static mc: MemoryCache

    public static async init(): Promise<void> {
        Cache.mc = await caching('memory', {
            max: 100,
            ttl: 60 * 60 * 1000,
        })
    }

    public static async set(key: string, value: any, ttl?: number): Promise<void> {
        if (!Cache.mc) await Cache.init()
        await Cache.mc.set(key, value, ttl)
    }
    public static async get<T>(key: string): Promise<T | undefined> {
        if (!Cache.mc) await Cache.init()
        return (await Cache.mc.get(key)) as T
    }
    public static async delete(key: string): Promise<void> {
        if (!Cache.mc) await Cache.init()
        await Cache.mc.del(key)
    }
    public static async reset(): Promise<void> {
        if (!Cache.mc) await Cache.init()
        await Cache.mc.reset()
    }
    public static async getStore(): Promise<MemoryStore> {
        if (!Cache.mc) await Cache.init()
        return await Cache.mc.store
    }
    public static async testPerformance(
        interaction: ChatInputCommandInteraction,
        callback: Function,
        cachingKey?: string,
    ): Promise<void> {
        const embed = new EmbedBuilder()
            .setColor(EmbedColors.DEFAULT)
            .setTimestamp()
            .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
            .setFooter({
                text: interaction.user.displayName ?? '',
                iconURL: interaction.user.avatarURL() ?? '',
            })
            .setTimestamp(new Date())
            .setImage(Config.Pictures.WHITESPACE)
        embed.setTitle('Cache Performance Test')

        var cacheStore = await Cache.getStore()
        var keyStore = await cacheStore.keys()
        var isInCache = false
        if (cachingKey && keyStore.includes(cachingKey)) isInCache = true

        const start = new Date().getTime()
        await callback()
        let elapsed = new Date().getTime() - start
        const formattedCode = await prettier.format(callback.toString(), {
            parser: 'typescript',
            tabWidth: 2,
        })
        var table = new AsciiTable3('Cache Performance')
            .setStyle('unicode-single')
            .setAlign(1, AlignmentEnum.LEFT)
            .setAlign(2, AlignmentEnum.RIGHT)
        table.addRow('Execution Time', elapsed)
        if (isInCache && cachingKey) {
            var ttl = await cacheStore.ttl(cachingKey)
            var ttlString = ''
            if (ttl) {
                var seconds = Math.floor(ttl / 1000)
                var minutes = Math.floor(seconds / 60)
                var hours = Math.floor(minutes / 60)
                var days = Math.floor(hours / 24)
                hours = hours - days * 24
                minutes = minutes - days * 24 * 60 - hours * 60
                seconds = seconds - days * 24 * 60 * 60 - hours * 60 * 60 - minutes * 60
                ttlString = `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${
                    minutes > 0 ? `${minutes}m ` : ''
                }${seconds > 0 ? `${seconds}s` : ''}`
            }

            table.addRow('Type', 'Cached with MemCache')
            table.addRow('CacheKey', cachingKey)
            table.addRow('TTL', ttlString)
        } else {
            table.addRow('Type', 'SQL Execute')
        }
        embed.setDescription(`\`\`\`js\n${formattedCode}\`\`\` \`\`\`\n${table.toString()}\`\`\``)
        await interaction.reply({ content: ``, embeds: [embed] })
    }
}
