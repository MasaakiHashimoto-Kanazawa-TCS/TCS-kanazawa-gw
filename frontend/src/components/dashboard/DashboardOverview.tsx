/**
 * ダッシュボード概要コンポーネント
 */

'use client';

import { useState, useEffect } from 'react';
import type { Plant, SensorData } from '@/types';
import { usePlantData, useSensorData, useAlerts } from '@/hooks';
import { PlantCard, MetricsGrid } from '@/components/dashboard';
import { CompactAlertBanner } from '@/components/alerts';
import { Button, LoadingSpinner, ErrorMessage, Badge, DotBadge } from '@/components/ui';
import { DATA_TYPE_OPTIONS, REALTIME_UPDATE_INTERVAL } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface DashboardOverviewProps {
  className?: string;
  autoRefresh?: boolean;
}

export function DashboardOverview({ className, autoRefresh: initialAutoRefresh = true }: DashboardOverviewProps) {
  console.log('DashboardOverview: Component rendering');
  
  const [selectedDataType, setSelectedDataType] = useState<'temperature' | 'pH'>('temperature');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(initialAutoRefresh);

  // 植物データの取得
  console.log('DashboardOverview: About to call usePlantData');
  const {
    plants,
    selectedPlant,
    loading: plantsLoading,
    error: plantsError,
    refreshData: refreshPlants,
    isRefetching: isRefetchingPlants
  } = usePlantData();

  console.log('DashboardOverview render:', { 
    plantsLoading, 
    plantsError, 
    plants: plants?.length, 
    selectedPlant: selectedPlant?.id 
  });

  // センサーデータの取得（温度）
  const {
    latest: latestTemperature,
    loading: temperatureLoading,
    error: temperatureError,
    refreshData: refreshTemperature
  } = useSensorData({
    dataType: 'temperature',
    autoRefresh: autoRefresh,
    realtime: autoRefresh
  });

  // センサーデータの取得（pH）
  const {
    latest: latestPH,
    loading: phLoading,
    error: phError,
    refreshData: refreshPH
  } = useSensorData({
    dataType: 'pH',
    autoRefresh: autoRefresh,
    realtime: autoRefresh
  });

  // アラート管理
  const {
    activeAlerts,
    unreadCount,
    acknowledgeAlert,
    dismissAlert,
    generateAlertsFromData
  } = useAlerts({
    plantId: selectedPlant?.id,
    thresholds: selectedPlant?.thresholds,
    autoGenerate: true
  });

  // データ更新時にアラートを生成
  useEffect(() => {
    if (selectedPlant && latestTemperature) {
      generateAlertsFromData([latestTemperature], 'temperature');
    }
  }, [selectedPlant, latestTemperature, generateAlertsFromData]);

  useEffect(() => {
    if (selectedPlant && latestPH) {
      generateAlertsFromData([latestPH], 'pH');
    }
  }, [selectedPlant, latestPH, generateAlertsFromData]);

  // 最終更新時刻の更新
  useEffect(() => {
    if (latestTemperature || latestPH) {
      setLastUpdateTime(new Date());
    }
  }, [latestTemperature, latestPH]);



  // 全データの更新
  const handleRefreshAll = async () => {
    await Promise.all([
      refreshPlants(),
      refreshTemperature(),
      refreshPH()
    ]);
  };

  // ローディング状態を改善 - 植物データのみでローディング判定
  const isLoading = plantsLoading;
  const isRefetching = isRefetchingPlants;

  // エラー状態
  const error = plantsError || temperatureError || phError;

  console.log('DashboardOverview conditions:', { 
    isLoading, 
    selectedPlant: !!selectedPlant, 
    error,
    shouldShowLoading: isLoading && !selectedPlant,
    shouldShowError: error && !selectedPlant
  });

  if (isLoading && !selectedPlant) {
    console.log('DashboardOverview: Showing loading spinner');
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" message="データを読み込み中..." />
      </div>
    );
  }

  if (error && !selectedPlant) {
    console.log('DashboardOverview: Showing error message');
    return (
      <div className="py-12">
        <ErrorMessage
          error={error}
          retry={handleRefreshAll}
          variant="card"
        />
      </div>
    );
  }

  console.log('DashboardOverview: Rendering main content');

  return (
    <div className={cn('space-y-6', className)}>
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            植物監視ダッシュボード
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            最終更新: {lastUpdateTime.toLocaleTimeString('ja-JP')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* アラート通知 */}
          {unreadCount > 0 && (
            <DotBadge count={unreadCount}>
              <Badge variant="danger" size="sm">
                {unreadCount}件のアラート
              </Badge>
            </DotBadge>
          )}

          {/* 自動更新チェックボックス */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              自動更新
            </span>
            {autoRefresh && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400">ON</span>
              </div>
            )}
          </label>

          {/* 更新ボタン */}
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            loading={isRefetching}
            disabled={isLoading}
          >
            更新
          </Button>
        </div>
      </div>

      {/* アクティブアラート */}
      {activeAlerts.length > 0 && (
        <CompactAlertBanner
          alerts={activeAlerts}
          onAcknowledge={acknowledgeAlert}
          onDismiss={dismissAlert}
        />
      )}

      {/* メトリクスグリッド */}
      {selectedPlant && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            現在の環境データ
          </h2>
          <MetricsGrid
            metrics={{
              temperature: latestTemperature?.value,
              pH: latestPH?.value
            }}
            thresholds={selectedPlant.thresholds}
            showTrends={true}
          />
        </div>
      )}

      {/* 植物カード */}
      {selectedPlant && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            植物の詳細情報
          </h2>
          <PlantCard
            plant={selectedPlant}
            temperatureData={latestTemperature || undefined}
            phData={latestPH || undefined}
            showDetails={true}
          />
        </div>
      )}

      {/* データタイプ選択（将来の拡張用） */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          データタイプ
        </h2>
        <div className="flex space-x-2">
          {DATA_TYPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={selectedDataType === option.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedDataType(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* システム状態 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          システム状態
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              植物監視: 正常
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              latestTemperature ? 'bg-green-500' : 'bg-red-500'
            )}></div>
            <span className="text-gray-600 dark:text-gray-400">
              温度センサー: {latestTemperature ? '正常' : 'エラー'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              latestPH ? 'bg-green-500' : 'bg-red-500'
            )}></div>
            <span className="text-gray-600 dark:text-gray-400">
              pHセンサー: {latestPH ? '正常' : 'エラー'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}