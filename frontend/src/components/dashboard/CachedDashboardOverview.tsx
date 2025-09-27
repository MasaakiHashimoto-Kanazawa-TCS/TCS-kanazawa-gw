/**
 * キャッシュ機能付きダッシュボード概要コンポーネント
 */

import React from 'react';
import { useCachedTimeRangeData, useCachedSensorSummary } from '@/hooks';
import { MetricsGrid } from './MetricsGrid';
import { TimeSeriesChart } from '@/components/charts';
import { Card } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface CachedDashboardOverviewProps {
  className?: string;
}

export function CachedDashboardOverview({ className }: CachedDashboardOverviewProps) {
  // キャッシュ機能付きで24時間のデータを取得
  const { 
    data: temperatureData, 
    loading: tempLoading, 
    error: tempError,
    isStale: tempStale,
    lastUpdated: tempLastUpdated
  } = useCachedTimeRangeData('temperature', '24h');

  const { 
    data: phData, 
    loading: phLoading, 
    error: phError,
    isStale: phStale,
    lastUpdated: phLastUpdated
  } = useCachedTimeRangeData('pH', '24h');

  // キャッシュ機能付きでサマリーデータを取得
  const { 
    data: tempSummary, 
    loading: tempSummaryLoading, 
    error: tempSummaryError 
  } = useCachedSensorSummary({ data_type: 'temperature', period: 'day' });

  const { 
    data: phSummary, 
    loading: phSummaryLoading, 
    error: phSummaryError 
  } = useCachedSensorSummary({ data_type: 'pH', period: 'day' });

  const isLoading = tempLoading || phLoading || tempSummaryLoading || phSummaryLoading;
  const hasError = tempError || phError || tempSummaryError || phSummaryError;

  if (hasError) {
    return (
      <div className={className}>
        <ErrorMessage 
          message="データの取得に失敗しました。しばらく待ってから再試行してください。" 
        />
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
        <div className="flex items-center gap-4">
          <span>
            温度データ: {tempStale ? '古いデータを表示中' : '最新データ'} 
            {tempLastUpdated && ` (${tempLastUpdated.toLocaleTimeString()})`}
          </span>
          <span>
            pHデータ: {phStale ? '古いデータを表示中' : '最新データ'}
            {phLastUpdated && ` (${phLastUpdated.toLocaleTimeString()})`}
          </span>
        </div>
      </div>

      {/* メトリクスグリッド */}
      <div className="mb-6">
        <MetricsGrid
          temperatureSummary={tempSummary}
          phSummary={phSummary}
          temperatureLoading={tempSummaryLoading}
          phLoading={phSummaryLoading}
        />
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">温度推移</h3>
          <TimeSeriesChart
            data={temperatureData || []}
            dataKey="value"
            xAxisKey="timestamp"
            color="#ef4444"
            height={300}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">pH推移</h3>
          <TimeSeriesChart
            data={phData || []}
            dataKey="value"
            xAxisKey="timestamp"
            color="#3b82f6"
            height={300}
          />
        </Card>
      </div>
    </div>
  );
}
