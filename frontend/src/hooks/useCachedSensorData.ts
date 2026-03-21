/**
 * キャッシュ機能付きセンサーデータフック
 */

import { useCachedApiData } from "./useCachedApiData";
import { cachedSensorService } from "@/lib/services/cachedSensorService";
import type { SensorData, DataSummary, DataType, GetDataParams, GetSummaryParams } from "@/types";

/**
 * キャッシュ機能付きセンサーデータ取得フック
 */
export function useCachedSensorData(params: GetDataParams) {
  const cacheKey = `sensor_data_${params.data_type}_${params.start_time}_${params.end_time}_${params.limit}`;

  return useCachedApiData<SensorData[]>(cacheKey, () => cachedSensorService.getData(params), {
    cacheConfig: {
      ttl: 5 * 60 * 1000, // 5分
      maxAge: 24 * 60 * 60 * 1000, // 24時間
      staleWhileRevalidate: true,
      backgroundRefresh: true,
    },
    refetchInterval: 5 * 60 * 1000, // 5分間隔で自動更新
  });
}

/**
 * キャッシュ機能付きデータサマリー取得フック
 */
export function useCachedSensorSummary(params: GetSummaryParams) {
  const cacheKey = `summary_${params.data_type}_${params.period}`;

  return useCachedApiData<DataSummary>(cacheKey, () => cachedSensorService.getSummary(params), {
    cacheConfig: {
      ttl: 30 * 60 * 1000, // 30分
      maxAge: 24 * 60 * 60 * 1000, // 24時間
      staleWhileRevalidate: true,
      backgroundRefresh: true,
    },
  });
}

/**
 * キャッシュ機能付き時間範囲データ取得フック
 */
export function useCachedTimeRangeData(dataType: DataType, timeRange: string) {
  const cacheKey = `time_range_${dataType}_${timeRange}`;

  return useCachedApiData<SensorData[]>(
    cacheKey,
    () => cachedSensorService.getDataByTimeRange(dataType, timeRange),
    {
      cacheConfig: {
        ttl: 5 * 60 * 1000, // 5分
        maxAge: 24 * 60 * 60 * 1000, // 24時間
        staleWhileRevalidate: true,
        backgroundRefresh: true,
      },
      refetchInterval: 5 * 60 * 1000, // 5分間隔で自動更新
    },
  );
}

/**
 * キャッシュ機能付きカスタム期間データ取得フック
 */
export function useCachedCustomRangeData(dataType: DataType, startTime: string, endTime: string) {
  const cacheKey = `custom_range_${dataType}_${startTime}_${endTime}`;

  return useCachedApiData<SensorData[]>(
    cacheKey,
    () => cachedSensorService.getDataByCustomRange(dataType, startTime, endTime),
    {
      cacheConfig: {
        ttl: 5 * 60 * 1000, // 5分
        maxAge: 24 * 60 * 60 * 1000, // 24時間
        staleWhileRevalidate: true,
        backgroundRefresh: true,
      },
    },
  );
}
