/**
 * 植物詳細ページ
 */

'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { PlantCard, SummaryMetrics } from '@/components/dashboard';
import { PlantDetails } from '@/components/plant';
import { ResponsiveTimeSeriesChart, ChartControls, ChartToolbar } from '@/components/charts';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { usePlantData, useSensorData, useAlerts } from '@/hooks';
import { formatDate } from '@/lib/utils';
import type { TimeRange, DataType } from '@/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function PlantDetailPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h');
  const [selectedDataType, setSelectedDataType] = useState<DataType>('temperature');

  // 植物データの取得
  const { selectedPlant, loading: plantLoading } = usePlantData();

  // センサーデータの取得
  const {
    data: sensorData,
    latest: latestData,
    summary: summaryData,
    loading: sensorLoading,
    error: sensorError,
    refreshData: refreshSensorData
  } = useSensorData({
    dataType: selectedDataType,
    timeRange: selectedTimeRange,
    autoRefresh: true,
    realtime: true
  });

  // アラート情報
  const { activeAlerts, unreadCount } = useAlerts({
    plantId: selectedPlant?.id,
    thresholds: selectedPlant?.thresholds
  });

  if (plantLoading || !selectedPlant) {
    return (
      <AppLayout title="植物詳細">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">
              植物データを読み込み中...
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <ErrorBoundary>
      <AppLayout title={`${selectedPlant.name} - 詳細`}>
        <div className="space-y-6">
          {/* ページヘッダー */}
          <ChartToolbar
            title={selectedPlant.name}
            subtitle={`${selectedPlant.species} - ${selectedPlant.location}`}
            actions={
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Badge variant="danger" size="sm">
                    {unreadCount}件のアラート
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshSensorData}
                  loading={sensorLoading}
                >
                  更新
                </Button>
              </div>
            }
          />

          {/* 植物詳細情報 */}
          <PlantDetails
            plant={selectedPlant}
            temperatureData={selectedDataType === 'temperature' ? latestData : undefined}
            phData={selectedDataType === 'ph' ? latestData : undefined}
          />

          {/* アクティブアラート */}
          {activeAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>アクティブなアラート</span>
                  <Badge variant="danger" size="sm">
                    {activeAlerts.length}件
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge 
                            variant="danger" 
                            size="sm"
                          >
                            {alert.severity === 'high' ? '緊急' : 
                             alert.severity === 'medium' ? '警告' : '注意'}
                          </Badge>
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            {alert.message}
                          </span>
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {formatDate(alert.timestamp)}
                        </div>
                        {alert.recommendedAction && (
                          <div className="text-sm text-red-700 dark:text-red-300 mt-2">
                            推奨: {alert.recommendedAction}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* チャート制御 */}
          <Card>
            <CardContent className="p-4">
              <ChartControls
                selectedTimeRange={selectedTimeRange}
                onTimeRangeChange={setSelectedTimeRange}
                selectedDataType={selectedDataType}
                onDataTypeChange={setSelectedDataType}
                showDataTypeSelector={true}
                isLoading={sensorLoading}
                onRefresh={refreshSensorData}
              />
            </CardContent>
          </Card>

          {/* 時系列チャート */}
          <ResponsiveTimeSeriesChart
            data={sensorData}
            dataType={selectedDataType}
            timeRange={selectedTimeRange}
            showThresholds={true}
            thresholds={selectedPlant.thresholds}
            title={`${selectedPlant.name}の${selectedDataType === 'temperature' ? '温度' : 'pH'}データ`}
          />

          {/* サマリーメトリクス */}
          {summaryData && (
            <SummaryMetrics
              data={{
                [selectedDataType]: {
                  current: latestData?.value || 0,
                  avg: summaryData.average,
                  min: summaryData.minimum,
                  max: summaryData.maximum
                }
              }}
              thresholds={selectedPlant.thresholds}
            />
          )}

          {/* 閾値設定 */}
          <Card>
            <CardHeader>
              <CardTitle>閾値設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    温度範囲
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">最小値:</span>
                      <span className="font-medium">{selectedPlant.thresholds.temperature.min}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">最大値:</span>
                      <span className="font-medium">{selectedPlant.thresholds.temperature.max}°C</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    pH範囲
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">最小値:</span>
                      <span className="font-medium">pH {selectedPlant.thresholds.ph.min}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">最大値:</span>
                      <span className="font-medium">pH {selectedPlant.thresholds.ph.max}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}