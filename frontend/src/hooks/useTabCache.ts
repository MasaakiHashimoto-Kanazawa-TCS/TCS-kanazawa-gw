/**
 * タブ間データキャッシュフック
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { cacheManager } from "@/lib/utils/cacheManager";

export interface TabCacheConfig {
  maxCacheSize: number;
  cacheExpiry: number;
  preloadOnTabSwitch: boolean;
  backgroundRefresh: boolean;
}

export interface TabCacheOptions {
  enabled?: boolean;
  config?: Partial<TabCacheConfig>;
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
  onCacheUpdate?: (key: string) => void;
}

const DEFAULT_CONFIG: TabCacheConfig = {
  maxCacheSize: 10 * 1024 * 1024, // 10MB
  cacheExpiry: 5 * 60 * 1000, // 5分
  preloadOnTabSwitch: true,
  backgroundRefresh: true,
};

export function useTabCache(options: TabCacheOptions = {}) {
  const { enabled = true, config = {}, onCacheHit, onCacheMiss, onCacheUpdate } = options;

  const { pathname } = useLocation();
  const cacheConfig = { ...DEFAULT_CONFIG, ...config };
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    updates: 0,
    size: 0,
  });
  const lastPathname = useRef<string>("");
  const cacheTimestamps = useRef<Map<string, number>>(new Map());

  // キャッシュキーを生成
  const generateCacheKey = useCallback((path: string, dataType?: string) => {
    return `tab_cache_${path}${dataType ? `_${dataType}` : ""}`;
  }, []);

  // データをキャッシュに保存
  const setCache = useCallback(
    <T>(path: string, data: T, dataType?: string) => {
      if (!enabled) return;

      const key = generateCacheKey(path, dataType);
      const timestamp = Date.now();

      try {
        cacheManager.set(
          key,
          {
            data,
            timestamp,
            path,
            dataType,
          },
          cacheConfig.cacheExpiry,
        );

        cacheTimestamps.current.set(key, timestamp);
        setCacheStats((prev) => ({
          ...prev,
          updates: prev.updates + 1,
          size: cacheManager.getStats().totalSize,
        }));

        onCacheUpdate?.(key);
      } catch (error) {
        console.error("Failed to set cache:", error);
      }
    },
    [enabled, generateCacheKey, cacheConfig.cacheExpiry, onCacheUpdate],
  );

  // キャッシュからデータを取得
  const getCache = useCallback(
    <T>(path: string, dataType?: string): T | null => {
      if (!enabled) return null;

      const key = generateCacheKey(path, dataType);

      try {
        const cached = cacheManager.get<{
          data: T;
          timestamp: number;
          path: string;
          dataType?: string;
        }>(key);

        if (cached) {
          const age = Date.now() - cached.timestamp;
          if (age < cacheConfig.cacheExpiry) {
            setCacheStats((prev) => ({
              ...prev,
              hits: prev.hits + 1,
            }));
            onCacheHit?.(key);
            return cached.data;
          } else {
            // 期限切れのキャッシュを削除
            cacheManager.remove(key);
            cacheTimestamps.current.delete(key);
          }
        }

        setCacheStats((prev) => ({
          ...prev,
          misses: prev.misses + 1,
        }));
        onCacheMiss?.(key);
        return null;
      } catch (error) {
        console.error("Failed to get cache:", error);
        return null;
      }
    },
    [enabled, generateCacheKey, cacheConfig.cacheExpiry, onCacheHit, onCacheMiss],
  );

  // キャッシュを削除
  const removeCache = useCallback(
    (path: string, dataType?: string) => {
      if (!enabled) return;

      const key = generateCacheKey(path, dataType);
      cacheManager.remove(key);
      cacheTimestamps.current.delete(key);
    },
    [enabled, generateCacheKey],
  );

  // パスに関連するキャッシュを削除
  const clearPathCache = useCallback(
    (path: string) => {
      if (!enabled) return;

      const keys = cacheTimestamps.current.keys();
      for (const key of keys) {
        if (key.includes(path)) {
          cacheManager.remove(key);
          cacheTimestamps.current.delete(key);
        }
      }
    },
    [enabled],
  );

  // 全キャッシュをクリア
  const clearAllCache = useCallback(() => {
    if (!enabled) return;

    cacheManager.clear();
    cacheTimestamps.current.clear();
    setCacheStats({
      hits: 0,
      misses: 0,
      updates: 0,
      size: 0,
    });
  }, [enabled]);

  // 期限切れのキャッシュをクリーンアップ
  const cleanupExpiredCache = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    const expiredKeys: string[] = [];

    cacheTimestamps.current.forEach((timestamp, key) => {
      if (now - timestamp > cacheConfig.cacheExpiry) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => {
      cacheManager.remove(key);
      cacheTimestamps.current.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }, [enabled, cacheConfig.cacheExpiry]);

  // キャッシュ統計を更新
  const updateCacheStats = useCallback(() => {
    const stats = cacheManager.getStats();
    setCacheStats((prev) => ({
      ...prev,
      size: stats.totalSize,
    }));
  }, []);

  // パス変更時の処理
  useEffect(() => {
    if (lastPathname.current !== pathname) {
      // 前のパスのキャッシュをバックグラウンドで更新
      if (cacheConfig.backgroundRefresh && lastPathname.current) {
        // バックグラウンド更新のロジックをここに実装
        console.log(`Background refresh for ${lastPathname.current}`);
      }

      lastPathname.current = pathname;
    }
  }, [pathname, cacheConfig.backgroundRefresh]);

  // 定期的なクリーンアップ
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      cleanupExpiredCache();
      updateCacheStats();
    }, 60000); // 1分間隔

    return () => clearInterval(interval);
  }, [enabled, cleanupExpiredCache, updateCacheStats]);

  // 初期統計更新
  useEffect(() => {
    updateCacheStats();
  }, [updateCacheStats]);

  return {
    setCache,
    getCache,
    removeCache,
    clearPathCache,
    clearAllCache,
    cleanupExpiredCache,
    cacheStats,
    isCached: (path: string, dataType?: string) => {
      const key = generateCacheKey(path, dataType);
      return cacheTimestamps.current.has(key);
    },
  };
}
