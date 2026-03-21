/**
 * キャッシュ機能付きAPIデータ取得フック
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { getErrorMessage, logError } from "@/lib/utils/errorHandler";

export interface CacheConfig {
  ttl: number; // Time To Live (ミリ秒)
  maxAge: number; // 最大保存期間 (ミリ秒)
  staleWhileRevalidate: boolean; // 古いデータを表示しながら更新
  backgroundRefresh: boolean; // バックグラウンド更新
}

export interface CachedApiDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  cacheConfig?: Partial<CacheConfig>;
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}

export interface CachedApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  isStale: boolean; // データが古いかどうか
  lastUpdated: Date | null;
  clearCache: () => void;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5分
  maxAge: 24 * 60 * 60 * 1000, // 24時間
  staleWhileRevalidate: true,
  backgroundRefresh: true,
};

/**
 * キャッシュ機能付きAPIデータ取得フック
 */
export function useCachedApiData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CachedApiDataOptions = {},
): CachedApiDataResult<T> {
  const { enabled = true, refetchInterval, cacheConfig = {}, onSuccess, onError } = options;

  const config = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };

  const [cachedData, setCachedData, clearCache] = useLocalStorage<CacheEntry<T> | null>(
    `cache_${key}`,
    null,
  );

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  // refを使用してコールバックを保存
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // refを更新
  useEffect(() => {
    fetcherRef.current = fetcher;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  // キャッシュの有効性をチェック
  const isCacheValid = useCallback(
    (cacheEntry: CacheEntry<T> | null): boolean => {
      if (!cacheEntry) return false;

      const now = Date.now();
      const age = now - cacheEntry.timestamp;

      // 最大保存期間を超えている場合は無効
      if (age > config.maxAge) return false;

      // TTLを超えている場合は古いデータとして扱う
      if (age > cacheEntry.ttl) {
        setIsStale(true);
        return config.staleWhileRevalidate;
      }

      setIsStale(false);
      return true;
    },
    [config.maxAge, config.ttl, config.staleWhileRevalidate],
  );

  // キャッシュからデータを復元
  const restoreFromCache = useCallback(() => {
    if (cachedData && isCacheValid(cachedData)) {
      console.log(`Restoring data from cache for key: ${key}`);
      setData(cachedData.data);
      setLastUpdated(new Date(cachedData.timestamp));
      setIsStale(false);
      return true;
    }
    return false;
  }, [cachedData, isCacheValid, key]);

  // データをキャッシュに保存
  const saveToCache = useCallback(
    (newData: T) => {
      const cacheEntry: CacheEntry<T> = {
        data: newData,
        timestamp: Date.now(),
        ttl: config.ttl,
      };
      setCachedData(cacheEntry);
      setLastUpdated(new Date());
    },
    [config.ttl, setCachedData],
  );

  const fetchData = useCallback(
    async (isRefetch = false, isBackground = false) => {
      if (!enabled) {
        console.log("useCachedApiData: Fetch disabled");
        return;
      }

      console.log(
        `useCachedApiData: Starting fetch, isRefetch: ${isRefetch}, isBackground: ${isBackground}`,
      );

      try {
        if (isRefetch && !isBackground) {
          setIsRefetching(true);
        } else if (!isBackground) {
          setLoading(true);
        }
        setError(null);

        const result = await fetcherRef.current();
        console.log("useCachedApiData: Fetch successful, result:", result);

        if (mountedRef.current) {
          setData(result);
          saveToCache(result);
          setIsStale(false);
          onSuccessRef.current?.(result);
        }
      } catch (err) {
        console.error("useCachedApiData: Fetch error:", err);
        if (mountedRef.current && !isBackground) {
          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
          logError(err, "useCachedApiData");
          onErrorRef.current?.(err);
        }
      } finally {
        if (mountedRef.current) {
          console.log("useCachedApiData: Fetch completed, setting loading to false");
          setLoading(false);
          setIsRefetching(false);
        }
      }
    },
    [enabled, saveToCache],
  );

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // バックグラウンド更新
  const backgroundRefresh = useCallback(async () => {
    if (config.backgroundRefresh && cachedData && isStale) {
      console.log("Background refresh triggered");
      await fetchData(true, true);
    }
  }, [config.backgroundRefresh, cachedData, isStale, fetchData]);

  // 初回データ取得
  useEffect(() => {
    console.log("useCachedApiData: Initial fetch effect, enabled:", enabled);
    if (enabled) {
      // まずキャッシュから復元を試行
      if (!restoreFromCache()) {
        console.log("useCachedApiData: No valid cache, fetching fresh data");
        void fetchData();
      } else {
        console.log("useCachedApiData: Using cached data");
        // 古いデータの場合はバックグラウンド更新
        if (isStale) {
          void backgroundRefresh();
        }
      }
    }
  }, [enabled, restoreFromCache, fetchData, isStale, backgroundRefresh]);

  // 定期更新の設定
  useEffect(() => {
    if (refetchInterval && enabled && refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        void fetchData(true);
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    isRefetching,
    isStale,
    lastUpdated,
    clearCache,
  };
}
