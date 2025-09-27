/**
 * タブプリフェッチフック
 */

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cacheManager } from '@/lib/utils/cacheManager';

export interface TabPrefetchConfig {
  prefetchOnHover: boolean;
  prefetchDelay: number;
  maxPrefetchConcurrency: number;
  prefetchTimeout: number;
}

export interface TabPrefetchOptions {
  enabled?: boolean;
  config?: Partial<TabPrefetchConfig>;
  onPrefetchStart?: (path: string) => void;
  onPrefetchComplete?: (path: string) => void;
  onPrefetchError?: (path: string, error: Error) => void;
}

const DEFAULT_CONFIG: TabPrefetchConfig = {
  prefetchOnHover: true,
  prefetchDelay: 200, // 200ms後にプリフェッチ開始
  maxPrefetchConcurrency: 3,
  prefetchTimeout: 10000 // 10秒でタイムアウト
};

export function useTabPrefetch(options: TabPrefetchOptions = {}) {
  const {
    enabled = true,
    config = {},
    onPrefetchStart,
    onPrefetchComplete,
    onPrefetchError
  } = options;

  const router = useRouter();
  const prefetchConfig = { ...DEFAULT_CONFIG, ...config };
  const prefetchTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const prefetchPromises = useRef<Map<string, Promise<void>>>(new Map());
  const activePrefetches = useRef<Set<string>>(new Set());

  // プリフェッチを開始
  const startPrefetch = useCallback(async (path: string) => {
    if (!enabled || activePrefetches.current.has(path)) {
      return;
    }

    // 既にキャッシュされている場合はスキップ
    const cacheKey = `prefetch_${path}`;
    if (cacheManager.get(cacheKey)) {
      return;
    }

    try {
      activePrefetches.current.add(path);
      onPrefetchStart?.(path);

      // プリフェッチの実行
      const prefetchPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Prefetch timeout'));
        }, prefetchConfig.prefetchTimeout);

        // 実際のプリフェッチ処理
        router.prefetch(path).then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch(reject);
      });

      prefetchPromises.current.set(path, prefetchPromise);
      await prefetchPromise;

      // プリフェッチ完了をキャッシュに記録
      cacheManager.set(cacheKey, { prefetched: true, timestamp: Date.now() }, 60 * 60 * 1000); // 1時間
      onPrefetchComplete?.(path);

    } catch (error) {
      console.error(`Prefetch failed for ${path}:`, error);
      onPrefetchError?.(path, error as Error);
    } finally {
      activePrefetches.current.delete(path);
      prefetchPromises.current.delete(path);
    }
  }, [enabled, router, prefetchConfig, onPrefetchStart, onPrefetchComplete, onPrefetchError]);

  // ホバー時のプリフェッチ
  const handleMouseEnter = useCallback((path: string) => {
    if (!enabled || !prefetchConfig.prefetchOnHover) {
      return;
    }

    // 既存のタイムアウトをクリア
    const existingTimeout = prefetchTimeouts.current.get(path);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 新しいタイムアウトを設定
    const timeout = setTimeout(() => {
      startPrefetch(path);
    }, prefetchConfig.prefetchDelay);

    prefetchTimeouts.current.set(path, timeout);
  }, [enabled, prefetchConfig, startPrefetch]);

  // ホバー終了時の処理
  const handleMouseLeave = useCallback((path: string) => {
    const timeout = prefetchTimeouts.current.get(path);
    if (timeout) {
      clearTimeout(timeout);
      prefetchTimeouts.current.delete(path);
    }
  }, []);

  // 手動プリフェッチ
  const prefetch = useCallback((path: string) => {
    if (!enabled) return;
    startPrefetch(path);
  }, [enabled, startPrefetch]);

  // プリフェッチのキャンセル
  const cancelPrefetch = useCallback((path: string) => {
    const timeout = prefetchTimeouts.current.get(path);
    if (timeout) {
      clearTimeout(timeout);
      prefetchTimeouts.current.delete(path);
    }

    const promise = prefetchPromises.current.get(path);
    if (promise) {
      // プロミスはキャンセルできないが、結果を無視
      promise.catch(() => {});
      prefetchPromises.current.delete(path);
    }

    activePrefetches.current.delete(path);
  }, []);

  // 全プリフェッチのキャンセル
  const cancelAllPrefetches = useCallback(() => {
    prefetchTimeouts.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    prefetchTimeouts.current.clear();
    prefetchPromises.current.clear();
    activePrefetches.current.clear();
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      cancelAllPrefetches();
    };
  }, [cancelAllPrefetches]);

  return {
    handleMouseEnter,
    handleMouseLeave,
    prefetch,
    cancelPrefetch,
    cancelAllPrefetches,
    isPrefetching: (path: string) => activePrefetches.current.has(path)
  };
}
