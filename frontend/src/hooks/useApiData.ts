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

  // refを使用してコールバックを保存
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // refを更新
  useEffect(() => {
    console.log('useApiData: Updating refs');
    fetcherRef.current = fetcher;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabled) {
      console.log('useApiData: Fetch disabled');
      return;
    }

    console.log('useApiData: Starting fetch, isRefetch:', isRefetch);

    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await fetcherRef.current();
      console.log('useApiData: Fetch successful, result:', result);
      
      if (mountedRef.current) {
        setData(result);
        onSuccessRef.current?.(result);
      }
    } catch (err) {
      console.error('useApiData: Fetch error:', err);
      if (mountedRef.current) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        logError(err, 'useApiData');
        onErrorRef.current?.(err);
      }
    } finally {
      if (mountedRef.current) {
        console.log('useApiData: Fetch completed, setting loading to false');
        setLoading(false);
        setIsRefetching(false);
      }
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // 初回データ取得
  useEffect(() => {
    console.log('useApiData: Initial fetch effect, enabled:', enabled);
    if (enabled) {
      console.log('useApiData: Calling fetchData for initial load');
      fetchData();
    }
  }, [enabled]);

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
  }, [refetchInterval, enabled]);

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