/**
 * 最適化されたダッシュボード概要コンポーネント（タブキャッシュ対応）
 */

import React from "react";
import { useCachedTimeRangeData, useCachedSensorSummary, useTabCache } from "@/hooks";
import { MetricsGrid } from "./MetricsGrid";
import { TimeSeriesChart } from "@/components/charts";
import { Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface OptimizedDashboardOverviewProps {
  className?: string;
}

export function OptimizedDashboardOverview({ className }: OptimizedDashboardOverviewProps) {
  // タブキャッシュ機能
  const { setCache, cacheStats } = useTabCache({
    enabled: true,
    config: {
      maxCacheSize: 5 * 1024 * 1024, // 5MB
      cacheExpiry: 3 * 60 * 1000, // 3分
      preloadOnTabSwitch: true,
      backgroundRefresh: true,
    },
    onCacheHit: (key) => {
      console.log(`Cache hit for ${key}`);
    },
    onCacheMiss: (key) => {
      console.log(`Cache miss for ${key}`);
    },
  });

  // キャッシュ機能付きで24時間のデータを取得
  const {
    data: temperatureData,
    loading: tempLoading,
    error: tempError,
    isStale: tempStale,
    lastUpdated: tempLastUpdated,
  } = useCachedTimeRangeData("temperature", "24h");

  const {
    data: phData,
    loading: phLoading,
    error: phError,
    isStale: phStale,
    lastUpdated: phLastUpdated,
  } = useCachedTimeRangeData("pH", "24h");

  // キャッシュ機能付きでサマリーデータを取得
  const {
    data: tempSummary,
    loading: tempSummaryLoading,
    error: tempSummaryError,
  } = useCachedSensorSummary({ data_type: "temperature", period: "day" });

  const {
    data: phSummary,
    loading: phSummaryLoading,
    error: phSummaryError,
  } = useCachedSensorSummary({ data_type: "pH", period: "day" });

  // データをキャッシュに保存
  React.useEffect(() => {
    if (temperatureData && temperatureData.length > 0) {
      setCache("/", temperatureData, "temperature_24h");
    }
  }, [temperatureData, setCache]);

  React.useEffect(() => {
    if (phData && phData.length > 0) {
      setCache("/", phData, "ph_24h");
    }
  }, [phData, setCache]);

  React.useEffect(() => {
    if (tempSummary) {
      setCache("/", tempSummary, "temperature_summary");
    }
  }, [tempSummary, setCache]);

  React.useEffect(() => {
    if (phSummary) {
      setCache("/", phSummary, "ph_summary");
    }
  }, [phSummary, setCache]);

  const isLoading = tempLoading || phLoading || tempSummaryLoading || phSummaryLoading;
  const hasError = tempError || phError || tempSummaryError || phSummaryError;

  if (hasError) {
    return (
      <div className={className}>
        <ErrorMessage error="データの取得に失敗しました。しばらく待ってから再試行してください。" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* キャッシュ状態の表示 */}
      <div className="mb-4 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              温度データ: {tempStale ? "古いデータを表示中" : "最新データ"}
              {tempLastUpdated && ` (${tempLastUpdated.toLocaleTimeString()})`}
            </span>
            <span>
              pHデータ: {phStale ? "古いデータを表示中" : "最新データ"}
              {phLastUpdated && ` (${phLastUpdated.toLocaleTimeString()})`}
            </span>
          </div>
          {/* キャッシュ統計（開発時のみ表示） */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500">
              キャッシュ: {cacheStats.hits}ヒット/{cacheStats.misses}ミス
            </div>
          )}
        </div>
      </div>

      {/* メトリクスグリッド */}
      <div className="mb-6">
        <MetricsGrid
          metrics={{
            temperature: temperatureData?.[temperatureData.length - 1]?.value,
            pH: phData?.[phData.length - 1]?.value,
          }}
          thresholds={undefined}
        />
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">温度推移</h3>
          <TimeSeriesChart
            data={temperatureData || []}
            dataType="temperature"
            timeRange="24h"
            height={300}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">pH推移</h3>
          <TimeSeriesChart data={phData || []} dataType="pH" timeRange="24h" height={300} />
        </Card>
      </div>
    </div>
  );
}
