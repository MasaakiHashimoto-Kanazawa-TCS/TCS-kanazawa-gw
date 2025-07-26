/**
 * 汎用APIデータ取得フック
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getErrorMessage, logError } from '@/lib/utils/errorHandler';

export interface UseApiDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}

export interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

/**
 * 汎用APIデータ取得フック
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  options: UseApiDataOptions = {}
): UseApiDataResult<T> {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabled) return;

    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await fetcher();
      
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        logError(err, 'useApiData');
        onError?.(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsRefetching(false);
      }
    }
  }, [fetcher, enabled, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // 初回データ取得
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  // 定期更新の設定
  useEffect(() => {
    if (refetchInterval && enabled && refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchData, refetchInterval, enabled]);

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
    isRefetching
  };
}