/**
 * キャッシュ管理ユーティリティ
 */

export interface CacheStats {
  totalKeys: number;
  totalSize: number;
  keys: string[];
  memoryUsage: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cachePrefix = "cache_";
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private maxKeys = 1000;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * キャッシュからデータを取得
   */
  get<T>(key: string): T | null {
    try {
      if (typeof window === "undefined") return null;

      const cacheKey = `${this.cachePrefix}${key}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      // TTLをチェック
      if (now - entry.timestamp > entry.ttl) {
        this.remove(key);
        return null;
      }

      // アクセス回数を更新
      entry.accessCount++;
      localStorage.setItem(cacheKey, JSON.stringify(entry));

      return entry.data;
    } catch (error) {
      console.error("Error reading from cache:", error);
      return null;
    }
  }

  /**
   * データをキャッシュに保存
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    try {
      if (typeof window === "undefined") return;

      // キャッシュサイズをチェック
      this.cleanupIfNeeded();

      const cacheKey = `${this.cachePrefix}${key}`;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
      };

      localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }

  /**
   * キャッシュから削除
   */
  remove(key: string): void {
    try {
      if (typeof window === "undefined") return;

      const cacheKey = `${this.cachePrefix}${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error("Error removing from cache:", error);
    }
  }

  /**
   * パターンに一致するキャッシュを削除
   */
  removePattern(pattern: string): void {
    try {
      if (typeof window === "undefined") return;

      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith(this.cachePrefix));

      cacheKeys.forEach((key) => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error removing cache pattern:", error);
    }
  }

  /**
   * 全キャッシュをクリア
   */
  clear(): void {
    try {
      if (typeof window === "undefined") return;

      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith(this.cachePrefix));

      cacheKeys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  /**
   * キャッシュ統計を取得
   */
  getStats(): CacheStats {
    try {
      if (typeof window === "undefined") {
        return { totalKeys: 0, totalSize: 0, keys: [], memoryUsage: 0 };
      }

      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith(this.cachePrefix));

      let totalSize = 0;
      const validKeys: string[] = [];

      cacheKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          validKeys.push(key.replace(this.cachePrefix, ""));
        }
      });

      return {
        totalKeys: validKeys.length,
        totalSize,
        keys: validKeys,
        memoryUsage: totalSize / (1024 * 1024), // MB
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return { totalKeys: 0, totalSize: 0, keys: [], memoryUsage: 0 };
    }
  }

  /**
   * 期限切れのキャッシュをクリーンアップ
   */
  cleanup(): void {
    try {
      if (typeof window === "undefined") return;

      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith(this.cachePrefix));
      const now = Date.now();

      cacheKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const entry = JSON.parse(value);
            if (now - entry.timestamp > entry.ttl) {
              localStorage.removeItem(key);
            }
          } catch {
            // 無効なエントリは削除
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error("Error cleaning up cache:", error);
    }
  }

  /**
   * 必要に応じてキャッシュをクリーンアップ
   */
  private cleanupIfNeeded(): void {
    const stats = this.getStats();

    // 最大キー数またはサイズを超えた場合
    if (stats.totalKeys > this.maxKeys || stats.memoryUsage > this.maxCacheSize / (1024 * 1024)) {
      this.cleanup();

      // まだ制限を超えている場合は古いエントリを削除
      if (stats.totalKeys > this.maxKeys) {
        this.removeOldestEntries();
      }
    }
  }

  /**
   * 最も古いエントリを削除
   */
  private removeOldestEntries(): void {
    try {
      if (typeof window === "undefined") return;

      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith(this.cachePrefix));

      // タイムスタンプでソート
      const entries = cacheKeys.map((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const entry = JSON.parse(value);
            return { key, timestamp: entry.timestamp, accessCount: entry.accessCount };
          } catch {
            return { key, timestamp: 0, accessCount: 0 };
          }
        }
        return { key, timestamp: 0, accessCount: 0 };
      });

      // アクセス回数が少なく、古いエントリを優先的に削除
      entries.sort((a, b) => {
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return a.timestamp - b.timestamp;
      });

      // 古いエントリの半分を削除
      const toRemove = Math.floor(entries.length / 2);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
    } catch (error) {
      console.error("Error removing oldest entries:", error);
    }
  }
}

// デフォルトのキャッシュマネージャー
export const cacheManager = CacheManager.getInstance();
