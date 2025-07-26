/**
 * 履歴ページ
 */

'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { 
  ResponsiveTimeSeriesChart, 
  ResponsiveComparisonChart, 
  ChartControls, 
  ChartStats, 
  ChartToolbar 
} from '@/components/charts';
import { Card, CardContent, Button, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { useSensorData, useMultiSensorData } from '@/hooks';
import { calculateDataStats } from '@/lib/utils/dataTransform';
import { DEFAULT_PLANT } from '@/types';
import type { TimeRange, DataType } from '@/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function HistoryPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h');
  const [selectedDataType, setSelectedDataType] = useState<DataType>('temperature');
  const [showComparison, setShowComparison] = useState(false);

  // 単一データタイプのデータ取得
  const {
    data: sensorData,
    loading: sensorLoading,
    error: sensorError,
    refreshData: refreshSensorData
  } = useSensorData({
    dataType: selectedDataType,
    timeRange: selectedTimeRange,
    autoRefresh: false
  });

  // 比較用の複数データタイプ取得
  const {
    data: multiData,
    loading: multiLoading,
    error: multiError,
    refetch: refreshMultiData
  } = useMultiSensorData(['temperature', 'ph'], selectedTimeRange);

  // 統計情報の計算
  const stats = useMemo(() => {
    if (showComparison) {
      return {
        temperature: calculateDataStats(multiData.temperature || []),
        ph: calculateDataStats(multiData.ph || [])
      };
    } else {
      return calculateDataStats(sensorData);
    }
  }, [sensorData, multiData, showComparison]);

  // データ更新
  const handleRefresh = () => {
    if (showComparison) {
      refreshMultiData();
    } else {
      refreshSensorData();
    }
  };

  // ローディング状態
  const isLoading = showComparison ? multiLoading : sensorLoading;
  const error = showComparison ? multiError : sensorError;

  return (
    <ErrorBoundary>
      <AppLayout title="データ履歴">
        <div className="space-y-6">
          {/* ページヘッダー */}
          <ChartToolbar
            title="データ履歴"
            subtitle="植物の環境データの履歴を確認できます"
            actions={
              <div className="flex items-center space-x-2">
                <Button
                  variant={showComparison ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? '比較表示中' : '比較表示'}
                </Button>
              </div>
            }
          />

          {/* チャート制御 */}
          <Card>
            <CardContent className="p-4">
              <ChartControls
                selectedTimeRange={selectedTimeRange}
                onTimeRangeChange={setSelectedTimeRange}
                selectedDataType={selectedDataType}
                onDataTypeChange={setSelectedDataType}
                showDataTypeSelector={!showComparison}
                isLoading={isLoading}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>

          {/* エラー表示 */}
          {error && (
            <ErrorMessage
              error={error}
              retry={handleRefresh}
              variant="banner"
            />
          )}

          {/* ローディング表示 */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" message="データを読み込み中..." />
            </div>
          )}

          {/* チャート表示 */}
          {!isLoading && !error && (
            <>
              {showComparison ? (
                <ResponsiveComparisonChart
                  temperatureData={multiData.temperature || []}
                  phData={multiData.ph || []}
                  timeRange={selectedTimeRange}
                />
              ) : (
                <ResponsiveTimeSeriesChart
                  data={sensorData}
                  dataType={selectedDataType}
                  timeRange={selectedTimeRange}
                  showThresholds={true}
                  thresholds={DEFAULT_PLANT.thresholds}
                />
              )}
            </>
          )}

          {/* 統計情報 */}
          {!isLoading && !error && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  統計情報
                </h3>
                
                {showComparison ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                        温度
                      </h4>
                      <ChartStats
                        stats={stats.temperature}
                        dataType="temperature"
                      />
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                        pH
                      </h4>
                      <ChartStats
                        stats={stats.ph}
                        dataType="ph"
                      />
                    </div>
                  </div>
                ) : (
                  <ChartStats
                    stats={stats}
                    dataType={selectedDataType}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* データエクスポート機能（将来実装） */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    データエクスポート
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    表示中のデータをCSV形式でダウンロードできます
                  </p>
                </div>
                <Button
                  variant="outline"
                  disabled={isLoading || !!error}
                  onClick={() => {
                    // CSV エクスポート機能（将来実装）
                    alert('CSV エクスポート機能は今後実装予定です');
                  }}
                >
                  CSV ダウンロード
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}