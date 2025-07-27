/**
 * センサーデータ取得フック
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { SensorData, DataType, DataSummary } from '@/types';
import { sensorService } from '@/lib/services';
import { useApiData } from './useApiData';
import { DATA_REFRESH_INTERVAL, REALTIME_UPDATE_INTERVAL } from '@/lib/constants';

export interface UseSensorDataOptions {
  dataType: DataType;
  timeRange?: string;
  autoRefresh?: boolean;
  realtime?: boolean;
}

export interface UseSensorDataResult {
  data: SensorData[];
  latest: SensorData | null;
  summary: DataSummary | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  isRefetching: boolean;
  subscribe: (dataType: DataType) => void;
  unsubscribe: () => void;
}

/**
 * センサーデータ取得フック
 */
export function useSensorData(options: UseSensorDataOptions): UseSensorDataResult {
  const { dataType, timeRange = '24h', autoRefresh = true, realtime = false } = options;
  
  const [latest, setLatest] = useState<SensorData | null>(null);
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 履歴データの取得
  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
    isRefetching: isRefetchingHistory
  } = useApiData(
    () => sensorService.getDataByTimeRange(dataType, timeRange),
    {
      refetchInterval: autoRefresh ? DATA_REFRESH_INTERVAL : undefined
    }
  );

  // 最新データの取得
  const {
    data: latestData,
    loading: latestLoading,
    error: latestError,
    refetch: refetchLatest,
    isRefetching: isRefetchingLatest
  } = useApiData(
    () => sensorService.getLatestData(dataType),
    {
      refetchInterval: autoRefresh ? REALTIME_UPDATE_INTERVAL : undefined,
      onSuccess: (data) => {
        if (data) {
          setLatest(data);
        }
      }
    }
  );

  // サマリーデータの取得
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
    isRefetching: isRefetchingSummary
  } = useApiData(
    () => sensorService.getSummary({ data_type: dataType, period: 'day' }),
    {
      refetchInterval: autoRefresh ? DATA_REFRESH_INTERVAL : undefined,
      onSuccess: (data) => {
        if (data) {
          setSummary(data);
        }
      }
    }
  );

  // リアルタイム更新の購読
  const subscribe = useCallback((subscribeDataType: DataType) => {
    // 既存の購読を解除
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // 新しい購読を開始
    unsubscribeRef.current = sensorService.subscribeToUpdates(
      subscribeDataType,
      (newData) => {
        setLatest(newData);
      }
    );
  }, []);

  // 購読解除
  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // データ更新
  const refreshData = useCallback(async () => {
    await Promise.all([
      refetchHistory(),
      refetchLatest(),
      refetchSummary()
    ]);
  }, [refetchHistory, refetchLatest, refetchSummary]);

  // リアルタイム更新の設定
  useEffect(() => {
    if (realtime) {
      // 既存の購読を解除
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // 新しい購読を開始
      unsubscribeRef.current = sensorService.subscribeToUpdates(
        dataType,
        (newData) => {
          setLatest(newData);
        }
      );
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [dataType, realtime]);

  // 統合されたローディング状態とエラー状態
  const loading = historyLoading || latestLoading || summaryLoading;
  const error = historyError || latestError || summaryError;
  const isRefetching = isRefetchingHistory || isRefetchingLatest || isRefetchingSummary;

  return {
    data: historyData || [],
    latest: latest || latestData,
    summary: summary || summaryData,
    loading,
    error,
    refreshData,
    isRefetching,
    subscribe,
    unsubscribe
  };
}

/**
 * 複数データタイプのセンサーデータ取得フック
 */
export function useMultiSensorData(dataTypes: DataType[], timeRange: string = '24h') {
  const [data, setData] = useState<Record<DataType, SensorData[]>>({} as Record<DataType, SensorData[]>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = dataTypes.map(async (dataType) => {
        const result = await sensorService.getDataByTimeRange(dataType, timeRange);
        return { dataType, data: result };
      });

      const results = await Promise.all(promises);
      const newData = {} as Record<DataType, SensorData[]>;
      
      results.forEach(({ dataType, data: sensorData }) => {
        newData[dataType] = sensorData;
      });

      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [dataTypes.join(','), timeRange]);

  useEffect(() => {
    if (dataTypes.length > 0) {
      fetchAllData();
    }
  }, [dataTypes.join(','), timeRange]);

  return {
    data,
    loading,
    error,
    refetch: fetchAllData
  };
}