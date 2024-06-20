import { caching, MemoryCache, MemoryStore } from 'cache-manager';

export class Cache {
    private static mc: MemoryCache;

    public static async init(): Promise<void> {
        Cache.mc = await caching('memory', {
            max: 100,
            ttl: 60 * 60 * 1000,
        });
    }

    public static async set(key: string, value: any, ttl?: number): Promise<void> {
        if (!Cache.mc) await Cache.init();
        await Cache.mc.set(key, value, ttl);
    }

    public static async get<T>(key: string): Promise<T | undefined> {
        if (!Cache.mc) await Cache.init();
        return (await Cache.mc.get(key)) as T;
    }

    public static async delete(key: string): Promise<void> {
        if (!Cache.mc) await Cache.init();
        await Cache.mc.del(key);
    }

    public static async reset(): Promise<void> {
        if (!Cache.mc) await Cache.init();
        await Cache.mc.reset();
    }

    public static async getStore(): Promise<MemoryStore> {
        if (!Cache.mc) await Cache.init();
        return Cache.mc.store;
    }
}
