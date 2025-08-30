/**
 * 履歴ページ
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { sensorService } from '@/lib/services';
import { calculateDataStats } from '@/lib/utils/dataTransform';
import { DEFAULT_PLANT } from '@/types';
import type { TimeRange, DataType, CustomTimeRange, SensorData } from '@/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function HistoryPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h');
  const [selectedDataType, setSelectedDataType] = useState<DataType>('temperature');
  const [showComparison, setShowComparison] = useState(false);
  const [customTimeRange, setCustomTimeRange] = useState<CustomTimeRange>();
  const [customData, setCustomData] = useState<SensorData[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // 単一データタイプのデータ取得（直接実装）
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [sensorLoading, setSensorLoading] = useState(true);
  const [sensorError, setSensorError] = useState<string | null>(null);

  // センサーデータを直接取得
  useEffect(() => {
    const fetchSensorData = async () => {
      if (selectedTimeRange === 'custom') return; // カスタム期間の場合はスキップ
      
      try {
        console.log('HistoryPage: Fetching sensor data', { selectedDataType, selectedTimeRange });
        setSensorLoading(true);
        setSensorError(null);
        
        const data = await sensorService.getDataByTimeRange(selectedDataType, selectedTimeRange);
        console.log('HistoryPage: Sensor data fetched', data.length);
        setSensorData(data);
      } catch (error) {
        console.error('HistoryPage: Sensor data fetch error', error);
        setSensorError(error instanceof Error ? error.message : 'データの取得に失敗しました');
      } finally {
        setSensorLoading(false);
      }
    };

    fetchSensorData();
  }, [selectedDataType, selectedTimeRange]);

  const refreshSensorData = async () => {
    if (selectedTimeRange === 'custom') return;
    
    try {
      setSensorLoading(true);
      const data = await sensorService.getDataByTimeRange(selectedDataType, selectedTimeRange);
      setSensorData(data);
    } catch (error) {
      setSensorError(error instanceof Error ? error.message : 'データの取得に失敗しました');
    } finally {
      setSensorLoading(false);
    }
  };

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

  // 型ガード関数
  const isComparisonStats = (stats: any): stats is { temperature: any; ph: any } => {
    return showComparison && 'temperature' in stats && 'ph' in stats;
  };

  // カスタム期間データの取得
  const fetchCustomData = async (range: CustomTimeRange) => {
    setCustomLoading(true);
    setCustomError(null);

    try {
      const data = await sensorService.getDataByCustomRange(
        selectedDataType,
        range.startDate,
        range.endDate
      );
      setCustomData(data);
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : 'データの取得に失敗しました');
    } finally {
      setCustomLoading(false);
    }
  };

  // カスタム期間が変更された時の処理
  useEffect(() => {
    if (selectedTimeRange === 'custom' && customTimeRange) {
      fetchCustomData(customTimeRange);
    }
  }, [customTimeRange, selectedDataType]);

  // データ更新
  const handleRefresh = () => {
    if (selectedTimeRange === 'custom' && customTimeRange) {
      fetchCustomData(customTimeRange);
    } else if (showComparison) {
      refreshMultiData();
    } else {
      refreshSensorData();
    }
  };

  // 表示用データの決定
  const displayData = selectedTimeRange === 'custom' ? customData : sensorData;
  const displayLoading = selectedTimeRange === 'custom' ? customLoading : (showComparison ? multiLoading : sensorLoading);
  const displayError = selectedTimeRange === 'custom' ? customError : (showComparison ? multiError : sensorError);

  // デバッグログ
  console.log('HistoryPage loading states:', {
    selectedTimeRange,
    showComparison,
    customLoading,
    multiLoading,
    sensorLoading,
    displayLoading,
    dataLength: displayData?.length
  });

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
                customTimeRange={customTimeRange}
                onCustomTimeRangeChange={setCustomTimeRange}
                selectedDataType={selectedDataType}
                onDataTypeChange={setSelectedDataType}
                showDataTypeSelector={!showComparison}
                isLoading={displayLoading}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>

          {/* エラー表示 */}
          {displayError && (
            <ErrorMessage
              error={displayError}
              retry={handleRefresh}
              variant="banner"
            />
          )}

          {/* ローディング表示 */}
          {displayLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" message="データを読み込み中..." />
            </div>
          )}

          {/* チャート表示 */}
          {!displayLoading && !displayError && (
            <>
              {showComparison ? (
                <ResponsiveComparisonChart
                  temperatureData={multiData.temperature || []}
                  phData={multiData.ph || []}
                  timeRange={selectedTimeRange}
                />
              ) : (
                <ResponsiveTimeSeriesChart
                  data={displayData}
                  dataType={selectedDataType}
                  timeRange={selectedTimeRange}
                  showThresholds={true}
                  thresholds={DEFAULT_PLANT.thresholds}
                />
              )}
            </>
          )}

          {/* 統計情報 */}
          {!displayLoading && !displayError && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  統計情報
                </h3>

                {isComparisonStats(stats) ? (
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
                    stats={selectedTimeRange === 'custom' ? calculateDataStats(displayData) : stats}
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
                  disabled={displayLoading || !!displayError}
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