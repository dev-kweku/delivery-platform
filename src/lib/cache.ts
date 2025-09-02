    interface CacheItem<T> {
        data: T;
        expires: number;
    }
    
    const cache = new Map<string, CacheItem<unknown>>();
    
    export const cacheGet = <T>(key: string): T | null => {
        const item = cache.get(key) as CacheItem<T> | undefined;
        if (!item) return null;
        
        if (item.expires < Date.now()) {
        cache.delete(key);
        return null;
        }
        
        return item.data;
    };
    
    export const cacheSet = <T>(key: string, data: T, ttlSeconds: number): void => {
        const expires = Date.now() + ttlSeconds * 1000;
        cache.set(key, { data, expires });
    };
    
    export const cacheClear = (): void => {
        cache.clear();
    };