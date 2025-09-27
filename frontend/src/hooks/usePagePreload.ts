/**
 * ページプリロードフック
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cacheManager } from '@/lib/utils/cacheManager';

export interface PagePreloadConfig {
  preloadOnMount: boolean;
  preloadDelay: number;
  maxPreloadConcurrency: number;
  preloadTimeout: number;
  cacheDuration: number;
}

export interface PagePreloadOptions {
  enabled?: boolean;
  config?: Partial<PagePreloadConfig>;
  preloadPaths?: string[];
  onPreloadStart?: (path: string) => void;
  onPreloadComplete?: (path: string) => void;
  onPreloadError?: (path: string, error: Error) => void;
}

const DEFAULT_CONFIG: PagePreloadConfig = {
  preloadOnMount: true,
  preloadDelay: 1000, // 1秒後にプリロード開始
  maxPreloadConcurrency: 2,
  preloadTimeout: 15000, // 15秒でタイムアウト
  cacheDuration: 30 * 60 * 1000 // 30分間キャッシュ
};

export function usePagePreload(options: PagePreloadOptions = {}) {
  const {
    enabled = true,
    config = {},
    preloadPaths = ['/history', '/plant', '/alerts'],
    onPreloadStart,
    onPreloadComplete,
    onPreloadError
  } = options;

  const router = useRouter();
  const preloadConfig = { ...DEFAULT_CONFIG, ...config };
  const [preloadedPages, setPreloadedPages] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);
  const preloadTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const preloadPromises = useRef<Map<string, Promise<void>>>(new Map());

  // ページのプリロードを実行
  const preloadPage = useCallback(async (path: string) => {
    if (!enabled || preloadedPages.has(path)) {
      return;
    }

    // キャッシュをチェック
    const cacheKey = `preload_${path}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      setPreloadedPages(prev => new Set([...prev, path]));
      return;
    }

    try {
      onPreloadStart?.(path);
      setIsPreloading(true);

      const preloadPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Preload timeout'));
        }, preloadConfig.preloadTimeout);

        // ページのプリロード実行
        router.prefetch(path).then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch(reject);
      });

      preloadPromises.current.set(path, preloadPromise);
      await preloadPromise;

      // プリロード完了をキャッシュに記録
      cacheManager.set(cacheKey, { 
        preloaded: true, 
        timestamp: Date.now() 
      }, preloadConfig.cacheDuration);

      setPreloadedPages(prev => new Set([...prev, path]));
      onPreloadComplete?.(path);

    } catch (error) {
      console.error(`Page preload failed for ${path}:`, error);
      onPreloadError?.(path, error as Error);
    } finally {
      preloadPromises.current.delete(path);
      if (preloadPromises.current.size === 0) {
        setIsPreloading(false);
      }
    }
  }, [enabled, router, preloadConfig, preloadedPages, onPreloadStart, onPreloadComplete, onPreloadError]);

  // 複数ページのプリロード
  const preloadPages = useCallback(async (paths: string[]) => {
    if (!enabled) return;

    const validPaths = paths.filter(path => !preloadedPages.has(path));
    if (validPaths.length === 0) return;

    // 同時実行数を制限
    const chunks = [];
    for (let i = 0; i < validPaths.length; i += preloadConfig.maxPreloadConcurrency) {
      chunks.push(validPaths.slice(i, i + preloadConfig.maxPreloadConcurrency));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map(path => preloadPage(path)));
    }
  }, [enabled, preloadConfig, preloadedPages, preloadPage]);

  // 指定されたパスのプリロード
  const preload = useCallback((path: string) => {
    if (!enabled) return;
    preloadPage(path);
  }, [enabled, preloadPage]);

  // プリロードのキャンセル
  const cancelPreload = useCallback((path: string) => {
    const timeout = preloadTimeouts.current.get(path);
    if (timeout) {
      clearTimeout(timeout);
      preloadTimeouts.current.delete(path);
    }

    const promise = preloadPromises.current.get(path);
    if (promise) {
      promise.catch(() => {});
      preloadPromises.current.delete(path);
    }
  }, []);

  // 全プリロードのキャンセル
  const cancelAllPreloads = useCallback(() => {
    preloadTimeouts.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    preloadTimeouts.current.clear();
    preloadPromises.current.clear();
    setIsPreloading(false);
  }, []);

  // マウント時の自動プリロード
  useEffect(() => {
    if (!enabled || !preloadConfig.preloadOnMount || preloadPaths.length === 0) {
      return;
    }

    const timeout = setTimeout(() => {
      preloadPages(preloadPaths);
    }, preloadConfig.preloadDelay);

    preloadTimeouts.current.set('auto', timeout);

    return () => {
      clearTimeout(timeout);
    };
  }, [enabled, preloadConfig, preloadPaths, preloadPages]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      cancelAllPreloads();
    };
  }, [cancelAllPreloads]);

  return {
    preload,
    preloadPages,
    cancelPreload,
    cancelAllPreloads,
    preloadedPages: Array.from(preloadedPages),
    isPreloading,
    isPreloaded: (path: string) => preloadedPages.has(path)
  };
}
